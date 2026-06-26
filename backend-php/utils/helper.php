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
    $method = $_SERVER['REQUEST_METHOD'];
    
    if (stripos($contentType, 'application/json') !== false) {
        $rawInput = file_get_contents('php://input');
        $jsonData = json_decode($rawInput, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $jsonData;
        }
    }
    
    // Support multipart/form-data for PUT/PATCH methods in PHP
    if (($method === 'PUT' || $method === 'PATCH') && stripos($contentType, 'multipart/form-data') !== false) {
        $rawInput = file_get_contents('php://input');
        preg_match('/boundary=(.*)$/', $contentType, $matches);
        $boundary = $matches[1] ?? '';
        if ($boundary) {
            list($putData, $putFiles) = parseRawMultipart($rawInput, $boundary);
            $_POST = array_merge($_POST, $putData);
            $_FILES = array_merge($_FILES, $putFiles);
        }
    }
    
    // Fallback to post/get merger (for multipart/form-data upload)
    return array_merge($_GET, $_POST);
}

/**
 * Parses raw multipart data for PUT/PATCH requests.
 */
function parseRawMultipart($raw_data, $boundary) {
    $parts = explode('--' . $boundary, $raw_data);
    $data = [];
    $files = [];
    
    foreach ($parts as $part) {
        if (empty($part) || strpos($part, '--') === 0) continue;
        
        $part = ltrim($part, "\r\n");
        $pos = strpos($part, "\r\n\r\n");
        if ($pos === false) continue;
        
        $raw_headers = substr($part, 0, $pos);
        $body = substr($part, $pos + 4);
        
        // Remove trailing \r\n
        if (substr($body, -2) === "\r\n") {
            $body = substr($body, 0, -2);
        }
        
        // Parse headers
        $headers = [];
        foreach (explode("\r\n", $raw_headers) as $header_line) {
            if (strpos($header_line, ':') === false) continue;
            list($header_name, $header_value) = explode(':', $header_line, 2);
            $headers[strtolower(trim($header_name))] = trim($header_value);
        }
        
        if (isset($headers['content-disposition'])) {
            preg_match('/name="([^"]+)"/', $headers['content-disposition'], $name_match);
            $name = $name_match[1] ?? '';
            
            if (preg_match('/filename="([^"]+)"/', $headers['content-disposition'], $filename_match)) {
                $filename = $filename_match[1];
                
                // Write content to a temporary file
                $tmp_name = tempnam(sys_get_temp_dir(), 'php_upload');
                file_put_contents($tmp_name, $body);
                
                $files[$name] = [
                    'name' => $filename,
                    'type' => $headers['content-type'] ?? 'application/octet-stream',
                    'tmp_name' => $tmp_name,
                    'error' => UPLOAD_ERR_OK,
                    'size' => strlen($body),
                ];
            } else {
                $data[$name] = $body;
            }
        }
    }
    
    return [$data, $files];
}
