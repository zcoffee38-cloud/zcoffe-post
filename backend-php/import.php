<?php
// Set execution timeout to unlimited (for large datasets)
set_time_limit(0);

// Headers for rendering output in browser
header('Content-Type: text/plain; charset=utf-8');

echo "=== Z Coffee POS - Data Migrator (PostgreSQL -> MySQL) ===\n\n";

require_once __DIR__ . '/config/database.php';

$jsonFile = __DIR__ . '/migration_data.json';
if (!file_exists($jsonFile)) {
    echo "❌ Error: 'migration_data.json' not found in this directory.\n";
    echo "Please upload 'migration_data.json' alongside this script inside public_html/api/.\n";
    exit;
}

$rawData = file_get_contents($jsonFile);
$data = json_decode($rawData, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "❌ Error: Invalid JSON structure. " . json_last_error_msg() . "\n";
    exit;
}

echo "📂 Loaded JSON data successfully.\n";

$db = getDBConnection();

/**
 * Formats ISO 8601 string to MySQL datetime format.
 */
function formatMySQLDate($isoString) {
    if (!$isoString) return null;
    $time = strtotime($isoString);
    return date('Y-m-d H:i:s', $time);
}

try {
    // Disable foreign key constraints temporarily
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    echo "🔓 Disabled foreign key constraints.\n";

    // 1. Truncate existing tables to start fresh
    $tables = ['stock_logs', 'queues', 'transaction_items', 'transactions', 'products', 'categories', 'users', 'settings'];
    foreach ($tables as $table) {
        $db->exec("TRUNCATE TABLE `$table`");
        echo "🗑️ Cleared table: $table\n";
    }
    echo "✨ All target tables cleared.\n\n";

    // 2. Insert Users
    if (isset($data['users']) && is_array($data['users'])) {
        echo "👤 Importing Users (" . count($data['users']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO users (id, name, email, password, role, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($data['users'] as $u) {
            $stmt->execute([
                $u['id'],
                $u['name'],
                $u['email'],
                $u['password'],
                $u['role'],
                formatMySQLDate($u['createdAt']),
                formatMySQLDate($u['updatedAt'])
            ]);
        }
    }

    // 3. Insert Categories
    if (isset($data['categories']) && is_array($data['categories'])) {
        echo "📁 Importing Categories (" . count($data['categories']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO categories (id, name, created_at) 
            VALUES (?, ?, ?)
        ");
        foreach ($data['categories'] as $c) {
            $stmt->execute([
                $c['id'],
                $c['name'],
                formatMySQLDate($c['createdAt'])
            ]);
        }
    }

    // 4. Insert Products
    if (isset($data['products']) && is_array($data['products'])) {
        echo "☕ Importing Products (" . count($data['products']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO products (id, category_id, name, image, price, hpp, stock, is_available, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($data['products'] as $p) {
            $stmt->execute([
                $p['id'],
                $p['categoryId'],
                $p['name'],
                $p['image'],
                $p['price'],
                $p['hpp'],
                $p['stock'],
                (isset($p['isAvailable']) && ($p['isAvailable'] === true || $p['isAvailable'] === 1)) ? 1 : 0,
                formatMySQLDate($p['createdAt']),
                formatMySQLDate($p['updatedAt'])
            ]);
        }
    }

    // 5. Insert Transactions
    if (isset($data['transactions']) && is_array($data['transactions'])) {
        echo "💰 Importing Transactions (" . count($data['transactions']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO transactions (id, invoice_number, customer_name, total, total_profit, payment_method, cash_amount, change_amount, created_by, created_at, is_deleted) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($data['transactions'] as $t) {
            $stmt->execute([
                $t['id'],
                $t['invoiceNumber'],
                $t['customerName'],
                $t['total'],
                $t['totalProfit'],
                $t['paymentMethod'],
                $t['cashAmount'],
                $t['changeAmount'],
                $t['createdById'],
                formatMySQLDate($t['createdAt']),
                (isset($t['isDeleted']) && ($t['isDeleted'] === true || $t['isDeleted'] === 1)) ? 1 : 0
            ]);
        }
    }

    // 6. Insert Transaction Items
    if (isset($data['transactionItems']) && is_array($data['transactionItems'])) {
        echo "🛒 Importing Transaction Items (" . count($data['transactionItems']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO transaction_items (id, transaction_id, product_id, qty, price, hpp, subtotal) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($data['transactionItems'] as $ti) {
            $stmt->execute([
                $ti['id'],
                $ti['transactionId'],
                $ti['productId'],
                $ti['qty'],
                $ti['price'],
                $ti['hpp'],
                $ti['subtotal']
            ]);
        }
    }

    // 7. Insert Queues
    if (isset($data['queues']) && is_array($data['queues'])) {
        echo "📺 Importing Queues (" . count($data['queues']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO queues (id, queue_number, status, transaction_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        foreach ($data['queues'] as $q) {
            $stmt->execute([
                $q['id'],
                $q['queueNumber'],
                $q['status'],
                $q['transactionId'],
                formatMySQLDate($q['createdAt']),
                formatMySQLDate($q['updatedAt'])
            ]);
        }
    }

    // 8. Insert Stock Logs
    if (isset($data['stockLogs']) && is_array($data['stockLogs'])) {
        echo "📋 Importing Stock Logs (" . count($data['stockLogs']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO stock_logs (id, product_id, type, qty, note, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        foreach ($data['stockLogs'] as $sl) {
            $stmt->execute([
                $sl['id'],
                $sl['productId'],
                $sl['type'],
                $sl['qty'],
                $sl['note'],
                formatMySQLDate($sl['createdAt'])
            ]);
        }
    }

    // 9. Insert Settings
    if (isset($data['settings']) && is_array($data['settings'])) {
        echo "⚙️ Importing Settings (" . count($data['settings']) . ")...\n";
        $stmt = $db->prepare("
            INSERT INTO settings (id, `key`, `value`, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($data['settings'] as $s) {
            $stmt->execute([
                $s['id'],
                $s['key'],
                $s['value'],
                formatMySQLDate($s['createdAt']),
                formatMySQLDate($s['updatedAt'])
            ]);
        }
    }

    // Re-enable foreign key constraints
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "\n🔒 Enabled foreign key constraints.\n";
    echo "🎉 Migration Complete!\n\n";
    echo "⚠️ IMPORTANT SECURITY WARNING:\n";
    echo "For security reasons, please DELETE 'import.php' and 'migration_data.json' from your cPanel File Manager immediately.\n";

} catch (Exception $e) {
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "\n❌ Migration Failed: " . $e->getMessage() . "\n";
}
