<?php
// CORS Headers (Before any output)
// Determine Origin
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Global Error Handling
set_exception_handler(function ($exception) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal Server Error: ' . $exception->getMessage()
    ]);
    exit;
});

// Require Core Files
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/response.php';
require_once __DIR__ . '/utils/helper.php';
require_once __DIR__ . '/middleware/auth.php';

// Ensure uploads directory exists
$uploadsDir = __DIR__ . '/uploads';
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Require Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/TransactionController.php';
require_once __DIR__ . '/controllers/QueueController.php';
require_once __DIR__ . '/controllers/StockController.php';
require_once __DIR__ . '/controllers/SettingController.php';
require_once __DIR__ . '/controllers/ReportController.php';

// Route Normalization
$requestUri = $_SERVER['REQUEST_URI'];
if (($pos = strpos($requestUri, '?')) !== false) {
    $requestUri = substr($requestUri, 0, $pos);
}

$scriptName = $_SERVER['SCRIPT_NAME'];
$basePath = dirname($scriptName);
if ($basePath === DIRECTORY_SEPARATOR || $basePath === '\\' || $basePath === '/') {
    $basePath = '';
}

// Extract path relative to api/index.php
$route = substr($requestUri, strlen($basePath));
$route = '/' . ltrim($route, '/');
$route = rtrim($route, '/');
if (empty($route)) {
    $route = '/';
}

$method = $_SERVER['REQUEST_METHOD'];
$params = [];

// Helper function to match dynamic routes (e.g. /v1/products/:id)
function matchRoute($pattern, $route, &$params) {
    $patternRegex = preg_replace('/:([a-zA-Z0-9_]+)/', '([^/]+)', $pattern);
    $patternRegex = '#^' . $patternRegex . '$#';
    
    if (preg_match($patternRegex, $route, $matches)) {
        array_shift($matches);
        preg_match_all('/:([a-zA-Z0-9_]+)/', $pattern, $paramNames);
        $paramNames = $paramNames[1];
        
        $params = [];
        foreach ($paramNames as $index => $name) {
            $params[$name] = $matches[$index];
        }
        return true;
    }
    return false;
}

// Router Mapping
// ----------------------------------------------------
// Auth Routes
if ($method === 'POST' && $route === '/v1/auth/login') {
    $controller = new AuthController();
    $controller->login();
} elseif ($method === 'GET' && $route === '/v1/auth/profile') {
    authenticate();
    $controller = new AuthController();
    $controller->getProfile();
}

// User Routes (Admin only)
elseif ($method === 'GET' && $route === '/v1/users') {
    authorize('admin');
    $controller = new UserController();
    $controller->getAll();
} elseif ($method === 'POST' && $route === '/v1/users') {
    authorize('admin');
    $controller = new UserController();
    $controller->create();
} elseif ($method === 'PUT' && matchRoute('/v1/users/:id', $route, $params)) {
    authorize('admin');
    $controller = new UserController();
    $controller->update($params['id']);
} elseif ($method === 'DELETE' && matchRoute('/v1/users/:id', $route, $params)) {
    authorize('admin');
    $controller = new UserController();
    $controller->delete($params['id']);
}

// Category Routes
elseif ($method === 'GET' && $route === '/v1/categories') {
    authenticate();
    $controller = new CategoryController();
    $controller->getAll();
} elseif ($method === 'POST' && $route === '/v1/categories') {
    authorize('admin');
    $controller = new CategoryController();
    $controller->create();
} elseif ($method === 'PUT' && matchRoute('/v1/categories/:id', $route, $params)) {
    authorize('admin');
    $controller = new CategoryController();
    $controller->update($params['id']);
} elseif ($method === 'DELETE' && matchRoute('/v1/categories/:id', $route, $params)) {
    authorize('admin');
    $controller = new CategoryController();
    $controller->delete($params['id']);
}

// Product Routes
elseif ($method === 'GET' && $route === '/v1/products') {
    authenticate();
    $controller = new ProductController();
    $controller->getAll();
} elseif ($method === 'GET' && matchRoute('/v1/products/:id', $route, $params)) {
    authenticate();
    $controller = new ProductController();
    $controller->getById($params['id']);
} elseif ($method === 'POST' && $route === '/v1/products') {
    authorize('admin');
    $controller = new ProductController();
    $controller->create();
} elseif ($method === 'POST' && matchRoute('/v1/products/:id', $route, $params)) {
    // Note: React uses multipart/form-data for product updates which might not support PUT in PHP out-of-the-box.
    // So we can support POST updates with an ID parameter or standard PUT.
    // Axios might send PUT. We will check both.
    authorize('admin');
    $controller = new ProductController();
    $controller->update($params['id']);
} elseif ($method === 'PUT' && matchRoute('/v1/products/:id', $route, $params)) {
    authorize('admin');
    $controller = new ProductController();
    $controller->update($params['id']);
} elseif ($method === 'DELETE' && matchRoute('/v1/products/:id', $route, $params)) {
    authorize('admin');
    $controller = new ProductController();
    $controller->delete($params['id']);
}

// Transaction Routes
elseif ($method === 'GET' && $route === '/v1/transactions') {
    authenticate();
    $controller = new TransactionController();
    $controller->getAll();
} elseif ($method === 'GET' && matchRoute('/v1/transactions/:id', $route, $params)) {
    authenticate();
    $controller = new TransactionController();
    $controller->getById($params['id']);
} elseif ($method === 'POST' && $route === '/v1/transactions') {
    authenticate();
    $controller = new TransactionController();
    $controller->create();
} elseif ($method === 'DELETE' && matchRoute('/v1/transactions/:id', $route, $params)) {
    authorize('admin', 'owner');
    $controller = new TransactionController();
    $controller->softDelete($params['id']);
}

// Queue Routes
elseif ($method === 'GET' && $route === '/v1/queues') {
    authenticate();
    $controller = new QueueController();
    $controller->getAll();
} elseif ($method === 'PATCH' && matchRoute('/v1/queues/:id/status', $route, $params)) {
    authenticate();
    $controller = new QueueController();
    $controller->updateStatus($params['id']);
}

// Stock Routes
elseif ($method === 'GET' && $route === '/v1/stock/logs') {
    authenticate();
    $controller = new StockController();
    $controller->getLogs();
} elseif ($method === 'POST' && $route === '/v1/stock/adjust') {
    authorize('admin');
    $controller = new StockController();
    $controller->adjust();
}

// Report Routes
elseif ($method === 'GET' && $route === '/v1/reports/dashboard') {
    authenticate();
    $controller = new ReportController();
    $controller->getDashboard();
} elseif ($method === 'GET' && $route === '/v1/reports/sales') {
    authorize('admin', 'owner');
    $controller = new ReportController();
    $controller->getSalesReport();
} elseif ($method === 'GET' && $route === '/v1/reports/top-products') {
    authorize('admin', 'owner');
    $controller = new ReportController();
    $controller->getTopProducts();
}

// Setting Routes
elseif ($method === 'GET' && $route === '/v1/settings') {
    authenticate();
    $controller = new SettingController();
    $controller->getAll();
} elseif ($method === 'PUT' && $route === '/v1/settings') {
    authorize('admin');
    $controller = new SettingController();
    $controller->update();
}

// Health Check & Default Route
elseif ($method === 'GET' && ($route === '/' || $route === '/health')) {
    sendSuccess('Z Coffee POS API is running', [
        'status' => 'ok',
        'service' => 'Z Coffee POS PHP API',
        'timestamp' => date('c')
    ]);
}

// Fallback 404 Not Found
else {
    sendError("Route {$method} {$route} not found", 404);
}
