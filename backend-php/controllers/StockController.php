<?php

class StockController {
    /**
     * Retrieves stock logs with pagination and optional product filtering.
     */
    public function getLogs() {
        $productId = isset($_GET['productId']) ? trim($_GET['productId']) : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
        
        $pagination = getPagination($page, $limit);
        $skip = $pagination['skip'];
        
        $db = getDBConnection();
        
        $whereClauses = [];
        $bindings = [];
        
        if (!empty($productId)) {
            $whereClauses[] = "sl.product_id = :productId";
            $bindings[':productId'] = $productId;
        }
        
        $whereSql = '';
        if (count($whereClauses) > 0) {
            $whereSql = "WHERE " . implode(" AND ", $whereClauses);
        }
        
        // Count total
        $countQuery = "SELECT COUNT(*) FROM stock_logs sl $whereSql";
        $countStmt = $db->prepare($countQuery);
        foreach ($bindings as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = intval($countStmt->fetchColumn());
        
        // Fetch logs
        $query = "
            SELECT sl.*, p.name AS product_name 
            FROM stock_logs sl 
            INNER JOIN products p ON sl.product_id = p.id 
            $whereSql 
            ORDER BY sl.created_at DESC 
            LIMIT :limit OFFSET :offset
        ";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':limit', $pagination['limit'], PDO::PARAM_INT);
        $stmt->bindValue(':offset', $skip, PDO::PARAM_INT);
        foreach ($bindings as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll();
        
        $logs = [];
        foreach ($rows as $row) {
            $logs[] = [
                'id' => $row['id'],
                'productId' => $row['product_id'],
                'type' => $row['type'],
                'qty' => intval($row['qty']),
                'note' => $row['note'],
                'createdAt' => $row['created_at'],
                'product' => [
                    'name' => $row['product_name']
                ]
            ];
        }
        
        sendSuccess('Stock logs retrieved successfully', $logs, 200, [
            'page' => $pagination['page'],
            'limit' => $pagination['limit'],
            'total' => $total,
            'totalPages' => ceil($total / $pagination['limit'])
        ]);
    }

    /**
     * Performs manual stock adjustments and logs the change.
     */
    public function adjust() {
        $data = getRequestData();
        $productId = isset($data['productId']) ? trim($data['productId']) : '';
        $type = isset($data['type']) ? trim($data['type']) : '';
        $qty = isset($data['qty']) ? intval($data['qty']) : 0;
        $note = isset($data['note']) ? trim($data['note']) : null;

        if (empty($productId) || empty($type) || !in_array($type, ['in', 'out', 'adjustment'])) {
            sendError('Required fields missing or invalid', 400);
        }

        if ($qty < 0) {
            sendError('Quantity must be greater than or equal to 0', 400);
        }

        $db = getDBConnection();
        $db->beginTransaction();

        try {
            // Lock product for update
            $prodStmt = $db->prepare("SELECT * FROM products WHERE id = ? FOR UPDATE");
            $prodStmt->execute([$productId]);
            $product = $prodStmt->fetch();

            if (!$product) {
                throw new Exception("Product not found");
            }

            $currentStock = intval($product['stock']);
            $newStock = $currentStock;

            if ($type === 'in') {
                $newStock = $currentStock + $qty;
            } elseif ($type === 'out') {
                $newStock = max(0, $currentStock - $qty);
            } elseif ($type === 'adjustment') {
                $newStock = $qty;
            }

            $isAvailable = $newStock > 0 ? 1 : 0;

            // Update product stock
            $updateProd = $db->prepare("UPDATE products SET stock = ?, is_available = ? WHERE id = ?");
            $updateProd->execute([$newStock, $isAvailable, $productId]);

            // Insert stock log
            $logStmt = $db->prepare("
                INSERT INTO stock_logs (id, product_id, type, qty, note) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $logStmt->execute([generateCuid(), $productId, $type, $qty, $note]);

            $db->commit();

            // Fetch and return updated product
            $updatedStmt = $db->prepare("SELECT * FROM products WHERE id = ?");
            $updatedStmt->execute([$productId]);
            $updatedProduct = $updatedStmt->fetch();

            sendSuccess('Stock adjusted successfully', [
                'id' => $updatedProduct['id'],
                'categoryId' => $updatedProduct['category_id'],
                'name' => $updatedProduct['name'],
                'image' => $updatedProduct['image'],
                'price' => intval($updatedProduct['price']),
                'hpp' => intval($updatedProduct['hpp']),
                'stock' => intval($updatedProduct['stock']),
                'isAvailable' => (bool)$updatedProduct['is_available'],
                'createdAt' => $updatedProduct['created_at'],
                'updatedAt' => $updatedProduct['updated_at']
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            sendError($e->getMessage(), 400);
        }
    }
}
