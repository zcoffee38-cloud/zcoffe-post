<?php

/**
 * Sends a JSON success response.
 *
 * @param string $message Response message
 * @param mixed $data Payload data
 * @param int $statusCode HTTP status code
 * @param array|null $pagination Pagination metadata
 */
function sendSuccess($message, $data = null, $statusCode = 200, $pagination = null) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    
    $response = [
        'success' => true,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($pagination !== null) {
        $response['pagination'] = $pagination;
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Sends a JSON error response.
 *
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 */
function sendError($message, $statusCode = 500) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}
