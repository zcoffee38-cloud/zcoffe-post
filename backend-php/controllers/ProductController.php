<?php

class ProductController {
    /**
     * Formats a raw product database row into camelCase for the API client.
     */
    private function formatProduct($row) {
        return [
            'id' => $row['id'],
            'categoryId' => $row['category_id'],
            'name' => $row['name'],
            'image' => $row['image'],
            'price' => intval($row['price']),
            'hpp' => intval($row['hpp']),
            'stock' => intval($row['stock']),
            'isAvailable' => (bool)$row['is_available'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
            'category' => [
                'id' => $row['category_id'],
                'name' => isset($row['category_name']) ? $row['category_name'] : ''
            ]
        ];
    }

    /**
     * Retrieves all products with filter, search, and pagination.
     */
    public function getAll() {
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $categoryId = isset($_GET['categoryId']) ? trim($_GET['categoryId']) : '';
        $available = isset($_GET['available']) ? trim($_GET['available']) : '';
        
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        $pagination = getPagination($page, $limit);
        $skip = $pagination['skip'];
        
        $db = getDBConnection();
        
        // Build query conditions
        $whereClauses = [];
        $bindings = [];
        
        if (!empty($search)) {
            $whereClauses[] = "p.name LIKE :search";
            $bindings[':search'] = "%$search%";
        }
        
        if (!empty($categoryId)) {
            $whereClauses[] = "p.category_id = :categoryId";
            $bindings[':categoryId'] = $categoryId;
        }
        
        if ($available !== '') {
            $whereClauses[] = "p.is_available = :available";
            $bindings[':available'] = ($available === 'true') ? 1 : 0;
        }
        
        $whereSql = '';
        if (count($whereClauses) > 0) {
            $whereSql = "WHERE " . implode(" AND ", $whereClauses);
        }
        
        // Count total matching records
        $countQuery = "SELECT COUNT(*) FROM products p $whereSql";
        $countStmt = $db->prepare($countQuery);
        foreach ($bindings as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = intval($countStmt->fetchColumn());
        
        // Retrieve records
        $query = "
            SELECT p.*, c.name AS category_name 
            FROM products p 
            INNER JOIN categories c ON p.category_id = c.id 
            $whereSql 
            ORDER BY p.created_at DESC 
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
        
        $products = [];
        foreach ($rows as $row) {
            $products[] = $this->formatProduct($row);
        }
        
        sendSuccess('Products retrieved successfully', $products, 200, [
            'page' => $pagination['page'],
            'limit' => $pagination['limit'],
            'total' => $total,
            'totalPages' => ceil($total / $pagination['limit'])
        ]);
    }

    /**
     * Retrieves a single product by ID.
     */
    public function getById($id) {
        $db = getDBConnection();
        $stmt = $db->prepare("
            SELECT p.*, c.name AS category_name 
            FROM products p 
            INNER JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? 
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        
        if (!$row) {
            sendError('Product not found', 404);
        }
        
        sendSuccess('Product retrieved successfully', $this->formatProduct($row));
    }

    /**
     * Creates a new product (handles multipart form upload).
     */
    public function create() {
        // Read form data (using $_POST or getRequestData fallback)
        $data = getRequestData();
        
        $categoryId = isset($data['categoryId']) ? trim($data['categoryId']) : '';
        $name = isset($data['name']) ? trim($data['name']) : '';
        $price = isset($data['price']) ? intval($data['price']) : 0;
        $hpp = isset($data['hpp']) ? intval($data['hpp']) : 0;
        $stock = isset($data['stock']) ? intval($data['stock']) : 0;
        $isAvailable = isset($data['isAvailable']) ? ($data['isAvailable'] !== 'false') : true;

        if (empty($categoryId) || empty($name) || $price <= 0 || $hpp < 0) {
            sendError('Required fields missing or invalid', 400);
        }

        $db = getDBConnection();
        
        // Verify category exists
        $catStmt = $db->prepare("SELECT COUNT(*) FROM categories WHERE id = ?");
        $catStmt->execute([$categoryId]);
        if (intval($catStmt->fetchColumn()) === 0) {
            sendError('Category not found', 400);
        }

        // Handle Image Upload
        $imageName = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['image']['tmp_name'];
            $fileName = $_FILES['image']['name'];
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            // Check allowed extensions
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (!in_array($fileExtension, $allowedExtensions)) {
                sendError('Invalid image type. Allowed: jpg, jpeg, png, webp, gif', 400);
            }
            
            $imageName = generateCuid() . '.' . $fileExtension;
            $destPath = UPLOAD_PATH . '/' . $imageName;
            
            if (!move_uploaded_file($fileTmpPath, $destPath)) {
                sendError('Failed to save uploaded image', 500);
            }
        }

        $id = generateCuid();
        
        // Start PDO Transaction to insert product and create stock log
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO products (id, category_id, name, image, price, hpp, stock, is_available) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id, $categoryId, $name, $imageName, $price, $hpp, $stock, $isAvailable ? 1 : 0
            ]);
            
            // If initial stock is > 0, log it
            if ($stock > 0) {
                $logStmt = $db->prepare("
                    INSERT INTO stock_logs (id, product_id, type, qty, note) 
                    VALUES (?, ?, 'in', ?, 'Initial stock registration')
                ");
                $logStmt->execute([generateCuid(), $id, $stock]);
            }
            
            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            // Delete uploaded file if database insert failed
            if ($imageName && file_exists(UPLOAD_PATH . '/' . $imageName)) {
                unlink(UPLOAD_PATH . '/' . $imageName);
            }
            throw $e;
        }

        // Retrieve created product
        $prodStmt = $db->prepare("
            SELECT p.*, c.name AS category_name 
            FROM products p 
            INNER JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? 
            LIMIT 1
        ");
        $prodStmt->execute([$id]);
        $row = $prodStmt->fetch();

        sendSuccess('Product created successfully', $this->formatProduct($row), 201);
    }

    /**
     * Updates an existing product.
     */
    public function update($id) {
        $data = getRequestData();
        
        $db = getDBConnection();
        
        // Get existing product
        $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        
        if (!$product) {
            sendError('Product not found', 404);
        }

        $categoryId = isset($data['categoryId']) ? trim($data['categoryId']) : $product['category_id'];
        $name = isset($data['name']) ? trim($data['name']) : $product['name'];
        $price = isset($data['price']) ? intval($data['price']) : intval($product['price']);
        $hpp = isset($data['hpp']) ? intval($data['hpp']) : intval($product['hpp']);
        $stock = isset($data['stock']) ? intval($data['stock']) : intval($product['stock']);
        
        $isAvailable = $product['is_available'];
        if (isset($data['isAvailable'])) {
            $isAvailable = ($data['isAvailable'] === 'true' || $data['isAvailable'] === true || $data['isAvailable'] === 1 || $data['isAvailable'] === '1');
        }

        // Verify category exists if changed
        if ($categoryId !== $product['category_id']) {
            $catStmt = $db->prepare("SELECT COUNT(*) FROM categories WHERE id = ?");
            $catStmt->execute([$categoryId]);
            if (intval($catStmt->fetchColumn()) === 0) {
                sendError('Category not found', 400);
            }
        }

        // Handle Image Upload
        $imageName = $product['image'];
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['image']['tmp_name'];
            $fileName = $_FILES['image']['name'];
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (!in_array($fileExtension, $allowedExtensions)) {
                sendError('Invalid image type. Allowed: jpg, jpeg, png, webp, gif', 400);
            }
            
            $newImageName = generateCuid() . '.' . $fileExtension;
            $destPath = UPLOAD_PATH . '/' . $newImageName;
            
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                // Delete old image if it exists
                if (!empty($product['image'])) {
                    $oldPath = UPLOAD_PATH . '/' . $product['image'];
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }
                $imageName = $newImageName;
            } else {
                sendError('Failed to save uploaded image', 500);
            }
        }

        // Check if stock is adjusted
        $db->beginTransaction();
        try {
            $updateStmt = $db->prepare("
                UPDATE products 
                SET category_id = ?, name = ?, image = ?, price = ?, hpp = ?, stock = ?, is_available = ? 
                WHERE id = ?
            ");
            $updateStmt->execute([
                $categoryId, $name, $imageName, $price, $hpp, $stock, $isAvailable ? 1 : 0, $id
            ]);

            // If stock value was updated manually, log it
            if ($stock !== intval($product['stock'])) {
                $qtyDiff = $stock - intval($product['stock']);
                $logType = $qtyDiff > 0 ? 'in' : 'out';
                $logStmt = $db->prepare("
                    INSERT INTO stock_logs (id, product_id, type, qty, note) 
                    VALUES (?, ?, ?, ?, 'Stock adjusted during product update')
                ");
                $logStmt->execute([generateCuid(), $id, $logType, abs($qtyDiff)]);
            }

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

        // Retrieve updated product
        $prodStmt = $db->prepare("
            SELECT p.*, c.name AS category_name 
            FROM products p 
            INNER JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? 
            LIMIT 1
        ");
        $prodStmt->execute([$id]);
        $row = $prodStmt->fetch();

        sendSuccess('Product updated successfully', $this->formatProduct($row));
    }

    /**
     * Deletes a product and its associated image file.
     */
    public function delete($id) {
        $db = getDBConnection();
        
        $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        
        if (!$product) {
            sendError('Product not found', 404);
        }

        // Check if product has transactions (cascade safety)
        $txItemStmt = $db->prepare("SELECT COUNT(*) FROM transaction_items WHERE product_id = ?");
        $txItemStmt->execute([$id]);
        if (intval($txItemStmt->fetchColumn()) > 0) {
            sendError('Cannot delete product because it exists in transaction history', 400);
        }

        // Delete stock logs first
        $delLogs = $db->prepare("DELETE FROM stock_logs WHERE product_id = ?");
        $delLogs->execute([$id]);

        // Delete product
        $deleteStmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $deleteStmt->execute([$id]);

        // Delete image file if exists
        if (!empty($product['image'])) {
            $imagePath = UPLOAD_PATH . '/' . $product['image'];
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }

        sendSuccess('Product deleted successfully');
    }
}
