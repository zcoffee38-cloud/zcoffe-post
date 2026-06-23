<?php

class TransactionController {
    /**
     * Helper to format transaction rows.
     */
    private function formatTransaction($t, $items, $queue) {
        $formattedItems = [];
        foreach ($items as $item) {
            $formattedItems[] = [
                'id' => $item['id'],
                'transactionId' => $item['transaction_id'],
                'productId' => $item['product_id'],
                'qty' => intval($item['qty']),
                'price' => intval($item['price']),
                'hpp' => intval($item['hpp']),
                'subtotal' => intval($item['subtotal']),
                'product' => [
                    'name' => $item['product_name']
                ]
            ];
        }

        return [
            'id' => $t['id'],
            'invoiceNumber' => $t['invoice_number'],
            'customerName' => $t['customer_name'],
            'total' => intval($t['total']),
            'totalProfit' => intval($t['total_profit']),
            'paymentMethod' => $t['payment_method'],
            'cashAmount' => $t['cash_amount'] !== null ? intval($t['cash_amount']) : null,
            'changeAmount' => $t['change_amount'] !== null ? intval($t['change_amount']) : null,
            'createdById' => $t['created_by'],
            'createdAt' => $t['created_at'],
            'isDeleted' => (bool)$t['is_deleted'],
            'createdBy' => [
                'name' => $t['created_by_name']
            ],
            'items' => $formattedItems,
            'queue' => $queue ? [
                'id' => $queue['id'],
                'queueNumber' => intval($queue['queue_number']),
                'status' => $queue['status'],
                'transactionId' => $queue['transaction_id'],
                'createdAt' => $queue['created_at'],
                'updatedAt' => $queue['updated_at']
            ] : null
        ];
    }

    /**
     * Retrieves all transactions (paginated, with search and date filters).
     */
    public function getAll() {
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $date = isset($_GET['date']) ? trim($_GET['date']) : '';
        
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        $pagination = getPagination($page, $limit);
        $skip = $pagination['skip'];
        
        $db = getDBConnection();
        
        // Build conditions
        $whereClauses = ["t.is_deleted = 0"];
        $bindings = [];
        
        if (!empty($search)) {
            $whereClauses[] = "(t.invoice_number LIKE :search OR t.customer_name LIKE :search)";
            $bindings[':search'] = "%$search%";
        }
        
        if (!empty($date)) {
            $whereClauses[] = "DATE(t.created_at) = :date";
            $bindings[':date'] = $date;
        }
        
        $whereSql = "WHERE " . implode(" AND ", $whereClauses);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) FROM transactions t $whereSql";
        $countStmt = $db->prepare($countQuery);
        foreach ($bindings as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = intval($countStmt->fetchColumn());
        
        // Fetch transactions
        $query = "
            SELECT t.*, u.name AS created_by_name 
            FROM transactions t 
            INNER JOIN users u ON t.created_by = u.id 
            $whereSql 
            ORDER BY t.created_at DESC 
            LIMIT :limit OFFSET :offset
        ";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':limit', $pagination['limit'], PDO::PARAM_INT);
        $stmt->bindValue(':offset', $skip, PDO::PARAM_INT);
        foreach ($bindings as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $transactionsRows = $stmt->fetchAll();
        
        if (count($transactionsRows) === 0) {
            sendSuccess('Transactions retrieved successfully', [], 200, [
                'page' => $pagination['page'],
                'limit' => $pagination['limit'],
                'total' => 0,
                'totalPages' => 0
            ]);
        }
        
        // Get all transaction IDs to batch fetch items and queues
        $txIds = array_column($transactionsRows, 'id');
        $inClause = implode(',', array_fill(0, count($txIds), '?'));
        
        // Fetch items
        $itemsStmt = $db->prepare("
            SELECT ti.*, p.name AS product_name 
            FROM transaction_items ti 
            INNER JOIN products p ON ti.product_id = p.id 
            WHERE ti.transaction_id IN ($inClause)
        ");
        $itemsStmt->execute($txIds);
        $allItems = $itemsStmt->fetchAll();
        
        // Group items by transaction ID
        $itemsByTx = [];
        foreach ($allItems as $item) {
            $itemsByTx[$item['transaction_id']][] = $item;
        }
        
        // Fetch queues
        $queuesStmt = $db->prepare("
            SELECT * FROM queues WHERE transaction_id IN ($inClause)
        ");
        $queuesStmt->execute($txIds);
        $allQueues = $queuesStmt->fetchAll();
        
        // Group queues by transaction ID
        $queuesByTx = [];
        foreach ($allQueues as $q) {
            $queuesByTx[$q['transaction_id']] = $q;
        }
        
        // Format transactions
        $transactions = [];
        foreach ($transactionsRows as $t) {
            $txItems = isset($itemsByTx[$t['id']]) ? $itemsByTx[$t['id']] : [];
            $txQueue = isset($queuesByTx[$t['id']]) ? $queuesByTx[$t['id']] : null;
            $transactions[] = $this->formatTransaction($t, $txItems, $txQueue);
        }
        
        sendSuccess('Transactions retrieved successfully', $transactions, 200, [
            'page' => $pagination['page'],
            'limit' => $pagination['limit'],
            'total' => $total,
            'totalPages' => ceil($total / $pagination['limit'])
        ]);
    }

    /**
     * Retrieves a single transaction by ID.
     */
    public function getById($id) {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT t.*, u.name AS created_by_name 
            FROM transactions t 
            INNER JOIN users u ON t.created_by = u.id 
            WHERE t.id = ? 
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $t = $stmt->fetch();
        
        if (!$t) {
            sendError('Transaction not found', 404);
        }
        
        // Fetch items
        $itemsStmt = $db->prepare("
            SELECT ti.*, p.name AS product_name 
            FROM transaction_items ti 
            INNER JOIN products p ON ti.product_id = p.id 
            WHERE ti.transaction_id = ?
        ");
        $itemsStmt->execute([$id]);
        $items = $itemsStmt->fetchAll();
        
        // Fetch queue
        $queueStmt = $db->prepare("SELECT * FROM queues WHERE transaction_id = ? LIMIT 1");
        $queueStmt->execute([$id]);
        $queue = $queueStmt->fetch() ?: null;
        
        sendSuccess('Transaction retrieved successfully', $this->formatTransaction($t, $items, $queue));
    }

    /**
     * Creates a new transaction (runs within database transaction).
     */
    public function create() {
        $data = getRequestData();
        
        $items = isset($data['items']) ? $data['items'] : null;
        $paymentMethod = isset($data['paymentMethod']) ? trim($data['paymentMethod']) : '';
        $cashAmount = isset($data['cashAmount']) ? $data['cashAmount'] : null;
        $customerName = isset($data['customerName']) ? trim($data['customerName']) : '';
        
        $currentUser = $_REQUEST['user'];

        if (!$items || !is_array($items) || count($items) === 0) {
            sendError('Items are required', 400);
        }

        if (empty($customerName)) {
            sendError('Customer name is required', 400);
        }
        
        if (!in_array($paymentMethod, ['cash', 'qris', 'transfer'])) {
            sendError('Invalid payment method', 400);
        }

        $db = getDBConnection();
        $db->beginTransaction();

        try {
            $total = 0;
            $totalProfit = 0;
            $itemsData = [];

            foreach ($items as $item) {
                $productId = isset($item['productId']) ? $item['productId'] : '';
                $qty = isset($item['qty']) ? intval($item['qty']) : 0;
                
                if (empty($productId) || $qty <= 0) {
                    throw new Exception("Invalid item or quantity");
                }

                // Lock the product row for update to prevent race conditions
                $prodStmt = $db->prepare("SELECT * FROM products WHERE id = ? FOR UPDATE");
                $prodStmt->execute([$productId]);
                $product = $prodStmt->fetch();

                if (!$product) {
                    throw new Exception("Product not found");
                }

                if (intval($product['stock']) < $qty) {
                    throw new Exception("Insufficient stock for " . $product['name']);
                }

                $subtotal = intval($product['price']) * $qty;
                $profit = (intval($product['price']) - intval($product['hpp'])) * $qty;
                
                $total += $subtotal;
                $totalProfit += $profit;

                $itemsData[] = [
                    'productId' => $product['id'],
                    'qty' => $qty,
                    'price' => intval($product['price']),
                    'hpp' => intval($product['hpp']),
                    'subtotal' => $subtotal,
                    'product_name' => $product['name']
                ];

                // Decrement stock and update availability
                $newStock = intval($product['stock']) - $qty;
                $isAvailable = $newStock > 0 ? 1 : 0;
                
                $updateProd = $db->prepare("UPDATE products SET stock = ?, is_available = ? WHERE id = ?");
                $updateProd->execute([$newStock, $isAvailable, $product['id']]);

                // Create stock log entry
                $logStmt = $db->prepare("
                    INSERT INTO stock_logs (id, product_id, type, qty, note) 
                    VALUES (?, ?, 'out', ?, 'Sale transaction')
                ");
                $logStmt->execute([generateCuid(), $product['id'], $qty]);
            }

            // Create Transaction record
            $txId = generateCuid();
            $invoiceNumber = generateInvoiceNumber();
            $calculatedCash = $cashAmount !== null ? intval($cashAmount) : null;
            $changeAmount = $calculatedCash !== null ? ($calculatedCash - $total) : null;

            $txStmt = $db->prepare("
                INSERT INTO transactions (id, invoice_number, customer_name, total, total_profit, payment_method, cash_amount, change_amount, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $txStmt->execute([
                $txId, $invoiceNumber, $customerName, $total, $totalProfit, $paymentMethod, $calculatedCash, $changeAmount, $currentUser['userId']
            ]);

            // Insert Transaction Items
            $itemInsert = $db->prepare("
                INSERT INTO transaction_items (id, transaction_id, product_id, qty, price, hpp, subtotal) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($itemsData as $itemIndex => $item) {
                $itemId = generateCuid() . '_' . $itemIndex;
                $itemInsert->execute([
                    $itemId, $txId, $item['productId'], $item['qty'], $item['price'], $item['hpp'], $item['subtotal']
                ]);
                $itemsData[$itemIndex]['id'] = $itemId;
                $itemsData[$itemIndex]['transaction_id'] = $txId;
            }

            // Generate Queue number
            // Get count of queues created today
            $queueCountStmt = $db->query("SELECT COUNT(*) FROM queues WHERE DATE(created_at) = CURDATE()");
            $queueCount = intval($queueCountStmt->fetchColumn());
            $queueNumber = $queueCount + 1;

            // Insert Queue
            $queueId = generateCuid();
            $queueInsert = $db->prepare("
                INSERT INTO queues (id, queue_number, status, transaction_id) 
                VALUES (?, ?, 'waiting', ?)
            ");
            $queueInsert->execute([$queueId, $queueNumber, $txId]);

            $db->commit();
            
            // Format returning object
            $responseTx = [
                'transaction' => [
                    'id' => $txId,
                    'invoiceNumber' => $invoiceNumber,
                    'customerName' => $customerName,
                    'total' => $total,
                    'totalProfit' => $totalProfit,
                    'paymentMethod' => $paymentMethod,
                    'cashAmount' => $calculatedCash,
                    'changeAmount' => $changeAmount,
                    'createdById' => $currentUser['userId'],
                    'createdBy' => [
                        'name' => $currentUser['email'] // default placeholder or query actual name
                    ],
                    'items' => array_map(function($i) {
                        return [
                            'productId' => $i['productId'],
                            'qty' => $i['qty'],
                            'price' => $i['price'],
                            'subtotal' => $i['subtotal'],
                            'product' => ['name' => $i['product_name']]
                        ];
                    }, $itemsData)
                ],
                'queue' => [
                    'id' => $queueId,
                    'queueNumber' => $queueNumber,
                    'status' => 'waiting',
                    'transactionId' => $txId
                ]
            ];

            sendSuccess('Transaction created successfully', $responseTx, 201);

        } catch (Exception $e) {
            $db->rollBack();
            sendError($e->getMessage(), 400);
        }
    }

    /**
     * Performs a soft delete of a transaction.
     */
    public function softDelete($id) {
        $db = getDBConnection();
        
        $stmt = $db->prepare("SELECT * FROM transactions WHERE id = ?");
        $stmt->execute([$id]);
        $tx = $stmt->fetch();
        
        if (!$tx) {
            sendError('Transaction not found', 404);
        }

        if (boolval($tx['is_deleted'])) {
            sendError('Transaction already deleted', 400);
        }

        $update = $db->prepare("UPDATE transactions SET is_deleted = 1 WHERE id = ?");
        $update->execute([$id]);

        sendSuccess('Transaction deleted successfully');
    }
}
