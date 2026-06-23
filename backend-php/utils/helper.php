<?php

/**
 * Generates a CUID-like unique identifier.
 * Length is 25 characters starting with 'c'.
 */
function generateCuid() {
    return 'c' . bin2hex(random_bytes(12));
}

/**
 * Calculates pagination values.
 *
 * @param int|string $pageInput
 * @param int|string $limitInput
 * @return array Array containing page, limit, and skip
 */
function getPagination($pageInput = 1, $limitInput = 10) {
    $page = max(1, intval($pageInput));
    $limit = max(1, intval($limitInput));
    $skip = ($page - 1) * $limit;
    return ['page' => $page, 'limit' => $limit, 'skip' => $skip];
}

/**
 * Generates an invoice number matching the Node.js implementation:
 * Format: ZC-YYYYMMDD-XXXXXX (where XXXXXX is the last 6 digits of current millisecond timestamp)
 */
function generateInvoiceNumber() {
    $date = date('Ymd');
    $milliseconds = round(microtime(true) * 1000);
    $timeStr = substr(strval($milliseconds), -6);
    return "ZC-{$date}-{$timeStr}";
}

/**
 * Parses and returns the request body (JSON or form data).
 */
function getRequestData() {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (stripos($contentType, 'application/json') !== false) {
        $rawInput = file_get_contents('php://input');
        $jsonData = json_decode($rawInput, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $jsonData;
        }
    }
    
    // Fallback to post/get merger (for multipart/form-data upload)
    return array_merge($_GET, $_POST);
}
