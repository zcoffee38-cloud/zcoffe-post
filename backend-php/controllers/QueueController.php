<?php

class QueueController {
    /**
     * Helper to format queue item details.
     */
    private function formatQueue($q, $items) {
        $formattedItems = [];
        foreach ($items as $item) {
            $formattedItems[] = [
                'qty' => intval($item['qty']),
                'product' => [
                    'name' => $item['product_name']
                ]
            ];
        }

        return [
            'id' => $q['id'],
            'queueNumber' => intval($q['queue_number']),
            'status' => $q['status'],
            'transactionId' => $q['transaction_id'],
            'createdAt' => $q['created_at'],
            'updatedAt' => $q['updated_at'],
            'transaction' => [
                'invoiceNumber' => $q['invoice_number'],
                'customerName' => $q['customer_name'],
                'createdBy' => [
                    'name' => $q['created_by_name']
                ],
                'items' => $formattedItems
            ]
        ];
    }

    /**
     * Retrieves all queues (defaults to today's queues).
     */
    public function getAll() {
        $status = isset($_GET['status']) ? trim($_GET['status']) : '';
        $date = isset($_GET['date']) ? trim($_GET['date']) : '';
        
        $db = getDBConnection();
        
        $whereClauses = ["t.is_deleted = 0"];
        $bindings = [];
        
        if (!empty($status)) {
            $whereClauses[] = "q.status = :status";
            $bindings[':status'] = $status;
        }
        
        if (!empty($date)) {
            $whereClauses[] = "DATE(q.created_at) = :date";
            $bindings[':date'] = $date;
        } else {
            // Default: today
            $whereClauses[] = "DATE(q.created_at) = CURDATE()";
        }
        
        $whereSql = "WHERE " . implode(" AND ", $whereClauses);
        
        $query = "
            SELECT q.*, t.invoice_number, t.customer_name, t.created_by, u.name AS created_by_name 
            FROM queues q 
            INNER JOIN transactions t ON q.transaction_id = t.id 
            INNER JOIN users u ON t.created_by = u.id 
            $whereSql 
            ORDER BY q.queue_number ASC
        ";
        
        $stmt = $db->prepare($query);
        foreach ($bindings as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $queuesRows = $stmt->fetchAll();
        
        if (count($queuesRows) === 0) {
            sendSuccess('Queues retrieved successfully', []);
        }
        
        // Fetch all items for these transaction IDs
        $txIds = array_column($queuesRows, 'transaction_id');
        $inClause = implode(',', array_fill(0, count($txIds), '?'));
        
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
        
        // Format queues
        $queues = [];
        foreach ($queuesRows as $q) {
            $qItems = isset($itemsByTx[$q['transaction_id']]) ? $itemsByTx[$q['transaction_id']] : [];
            $queues[] = $this->formatQueue($q, $qItems);
        }
        
        sendSuccess('Queues retrieved successfully', $queues);
    }

    /**
     * Updates queue status.
     */
    public function updateStatus($id) {
        $data = getRequestData();
        $status = isset($data['status']) ? trim($data['status']) : '';
        
        if (!in_array($status, ['waiting', 'processing', 'done'])) {
            sendError('Invalid status', 400);
        }
        
        $db = getDBConnection();
        
        // Check if queue exists
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM queues WHERE id = ?");
        $checkStmt->execute([$id]);
        if (intval($checkStmt->fetchColumn()) === 0) {
            sendError('Queue not found', 404);
        }
        
        // Update
        $stmt = $db->prepare("UPDATE queues SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$status, $id]);
        
        // Retrieve updated queue with full details
        $queueQuery = "
            SELECT q.*, t.invoice_number, t.customer_name, t.created_by, u.name AS created_by_name 
            FROM queues q 
            INNER JOIN transactions t ON q.transaction_id = t.id 
            INNER JOIN users u ON t.created_by = u.id 
            WHERE q.id = ? 
            LIMIT 1
        ";
        $queueStmt = $db->prepare($queueQuery);
        $queueStmt->execute([$id]);
        $qRow = $queueStmt->fetch();
        
        // Fetch items
        $itemsStmt = $db->prepare("
            SELECT ti.*, p.name AS product_name 
            FROM transaction_items ti 
            INNER JOIN products p ON ti.product_id = p.id 
            WHERE ti.transaction_id = ?
        ");
        $itemsStmt->execute([$qRow['transaction_id']]);
        $items = $itemsStmt->fetchAll();
        
        $formattedQueue = $this->formatQueue($qRow, $items);
        
        sendSuccess('Queue status updated successfully', $formattedQueue);
    }
}
