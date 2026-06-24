<?php

class ReportController {
    /**
     * Retrieves today's sales metrics, active queues count, and top 5 products.
     */
    public function getDashboard() {
        $db = getDBConnection();

        // 1. Today's Sales Summary
        $salesQuery = "
            SELECT 
                COALESCE(SUM(total), 0) AS total_sales, 
                COALESCE(SUM(total_profit), 0) AS total_profit, 
                COUNT(id) AS tx_count 
            FROM transactions 
            WHERE created_at >= CURDATE() 
              AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
              AND is_deleted = 0
        ";
        $salesStmt = $db->query($salesQuery);
        $salesData = $salesStmt->fetch();

        // 2. Today's Active Queues Count (status: waiting or processing)
        $queuesQuery = "
            SELECT COUNT(q.id) AS active_count 
            FROM queues q 
            INNER JOIN transactions t ON q.transaction_id = t.id 
            WHERE q.status IN ('waiting', 'processing') 
              AND q.created_at >= CURDATE() 
              AND q.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
              AND t.is_deleted = 0
        ";
        $queuesStmt = $db->query($queuesQuery);
        $activeQueuesCount = intval($queuesStmt->fetchColumn());

        // 3. Top 5 Products Today
        $topProductsQuery = "
            SELECT 
                ti.product_id, 
                SUM(ti.qty) AS total_qty, 
                p.name AS product_name, 
                p.image AS product_image 
            FROM transaction_items ti 
            INNER JOIN transactions t ON ti.transaction_id = t.id 
            INNER JOIN products p ON ti.product_id = p.id 
            WHERE t.created_at >= CURDATE() 
              AND t.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
              AND t.is_deleted = 0 
            GROUP BY ti.product_id, p.name, p.image 
            ORDER BY total_qty DESC 
            LIMIT 5
        ";
        $topStmt = $db->query($topProductsQuery);
        $topRows = $topStmt->fetchAll();

        $topProducts = [];
        foreach ($topRows as $row) {
            $topProducts[] = [
                'productId' => $row['product_id'],
                'name' => $row['product_name'],
                'image' => $row['product_image'],
                'totalQty' => intval($row['total_qty'])
            ];
        }

        sendSuccess('Dashboard data retrieved successfully', [
            'todaySales' => intval($salesData['total_sales']),
            'todayTransactions' => intval($salesData['tx_count']),
            'todayProfit' => intval($salesData['total_profit']),
            'activeQueues' => $activeQueuesCount,
            'topProducts' => $topProducts
        ]);
    }

    /**
     * Generates a sales report for a specified date range.
     */
    public function getSalesReport() {
        $startDate = isset($_GET['startDate']) ? trim($_GET['startDate']) : '';
        $endDate = isset($_GET['endDate']) ? trim($_GET['endDate']) : '';

        // Default: last 30 days
        $start = !empty($startDate) ? $startDate . " 00:00:00" : date('Y-m-d H:i:s', strtotime('-30 days'));
        $end = !empty($endDate) ? $endDate . " 23:59:59" : date('Y-m-d 23:59:59');

        $db = getDBConnection();

        // Retrieve transactions
        $stmt = $db->prepare("
            SELECT t.*, u.name AS created_by_name 
            FROM transactions t 
            INNER JOIN users u ON t.created_by = u.id 
            WHERE t.created_at >= ? AND t.created_at <= ? AND t.is_deleted = 0 
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$start, $end]);
        $transactionsRows = $stmt->fetchAll();

        $summary = [
            'totalRevenue' => 0,
            'totalProfit' => 0,
            'totalTransactions' => count($transactionsRows)
        ];

        if (count($transactionsRows) === 0) {
            sendSuccess('Sales report retrieved successfully', [
                'summary' => $summary,
                'transactions' => []
            ]);
        }

        // Fetch transaction items
        $txIds = array_column($transactionsRows, 'id');
        $inClause = implode(',', array_fill(0, count($txIds), '?'));
        
        $itemsStmt = $db->prepare("
            SELECT ti.*, p.name AS product_name 
            FROM transaction_items ti 
            INNER JOIN products p ON ti.product_id = p.id 
            WHERE ti.transaction_id IN ($inClause)
        ");
        $itemsStmt->execute($txIds);
        $allItems = $itemsStmt->fetchAll();

        $itemsByTx = [];
        foreach ($allItems as $item) {
            $itemsByTx[$item['transaction_id']][] = $item;
        }

        $transactions = [];
        foreach ($transactionsRows as $t) {
            $total = intval($t['total']);
            $profit = intval($t['total_profit']);

            $summary['totalRevenue'] += $total;
            $summary['totalProfit'] += $profit;

            $formattedItems = [];
            $txItems = isset($itemsByTx[$t['id']]) ? $itemsByTx[$t['id']] : [];
            foreach ($txItems as $item) {
                $formattedItems[] = [
                    'id' => $item['id'],
                    'qty' => intval($item['qty']),
                    'price' => intval($item['price']),
                    'subtotal' => intval($item['subtotal']),
                    'product' => [
                        'name' => $item['product_name']
                    ]
                ];
            }

            $transactions[] = [
                'id' => $t['id'],
                'invoiceNumber' => $t['invoice_number'],
                'customerName' => $t['customer_name'],
                'total' => $total,
                'totalProfit' => $profit,
                'paymentMethod' => $t['payment_method'],
                'createdAt' => $t['created_at'],
                'createdBy' => [
                    'name' => $t['created_by_name']
                ],
                'items' => $formattedItems
            ];
        }

        sendSuccess('Sales report retrieved successfully', [
            'summary' => $summary,
            'transactions' => $transactions
        ]);
    }

    /**
     * Retrieves the top selling products within a date range.
     */
    public function getTopProducts() {
        $startDate = isset($_GET['startDate']) ? trim($_GET['startDate']) : '';
        $endDate = isset($_GET['endDate']) ? trim($_GET['endDate']) : '';
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

        // Default: last 30 days
        $start = !empty($startDate) ? $startDate . " 00:00:00" : date('Y-m-d H:i:s', strtotime('-30 days'));
        $end = !empty($endDate) ? $endDate . " 23:59:59" : date('Y-m-d 23:59:59');

        $db = getDBConnection();

        $query = "
            SELECT 
                ti.product_id, 
                SUM(ti.qty) AS total_qty, 
                SUM(ti.subtotal) AS total_revenue, 
                p.name AS product_name, 
                p.image AS product_image, 
                p.price AS product_price 
            FROM transaction_items ti 
            INNER JOIN transactions t ON ti.transaction_id = t.id 
            INNER JOIN products p ON ti.product_id = p.id 
            WHERE t.created_at >= :start AND t.created_at <= :end AND t.is_deleted = 0 
            GROUP BY ti.product_id, p.name, p.image, p.price 
            ORDER BY total_qty DESC 
            LIMIT :limit
        ";

        $stmt = $db->prepare($query);
        $stmt->bindValue(':start', $start, PDO::PARAM_STR);
        $stmt->bindValue(':end', $end, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $result = [];
        foreach ($rows as $row) {
            $result[] = [
                'productId' => $row['product_id'],
                'name' => $row['product_name'],
                'image' => $row['product_image'],
                'price' => intval($row['product_price']),
                'totalQty' => intval($row['total_qty']),
                'totalRevenue' => intval($row['total_revenue'])
            ];
        }

        sendSuccess('Top products retrieved successfully', $result);
    }
}
