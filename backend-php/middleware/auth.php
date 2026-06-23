<?php
require_once dirname(__DIR__) . '/utils/jwt.php';
require_once dirname(__DIR__) . '/utils/response.php';
require_once dirname(__DIR__) . '/config/database.php';

/**
 * Retrieves the Authorization header from the request.
 */
function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        // Standardize key case
        $requestHeaders = array_combine(array_map('strtolower', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['authorization'])) {
            $headers = trim($requestHeaders['authorization']);
        }
    }
    return $headers;
}

/**
 * Authenticates the request by verifying the JWT token.
 * Populates $_REQUEST['user'] if successful, otherwise terminates with 401.
 */
function authenticate() {
    $authHeader = getAuthorizationHeader();
    
    if (!$authHeader || strpos($authHeader, 'Bearer ') !== 0) {
        sendError('Unauthorized', 401);
    }
    
    $token = substr($authHeader, 7);
    $payload = jwtDecode($token, JWT_SECRET);
    
    if (!$payload) {
        sendError('Unauthorized', 401);
    }
    
    $_REQUEST['user'] = $payload;
    return $payload;
}

/**
 * Authorizes the request by checking if the user has one of the allowed roles.
 * Terminate with 403 if user role is not allowed.
 */
function authorize(...$allowedRoles) {
    $user = isset($_REQUEST['user']) ? $_REQUEST['user'] : authenticate();
    
    if (!isset($user['role']) || !in_array($user['role'], $allowedRoles)) {
        sendError('Forbidden', 403);
    }
    
    return $user;
}
