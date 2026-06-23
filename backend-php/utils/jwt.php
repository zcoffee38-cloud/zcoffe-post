<?php

/**
 * Encodes data to Base64Url format.
 */
function base64url_encode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

/**
 * Decodes data from Base64Url format.
 */
function base64url_decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $data .= str_repeat('=', $padlen);
    }
    return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
}

/**
 * Generates a JWT token.
 *
 * @param array $payload The payload data
 * @param string $secret The signing secret key
 * @param int $expiresIn Time to live in seconds
 * @return string The encoded JWT token
 */
function jwtEncode($payload, $secret, $expiresIn = 604800) {
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    
    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + $expiresIn;
    }
    
    $base64UrlHeader = base64url_encode($header);
    $base64UrlPayload = base64url_encode(json_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = base64url_encode($signature);
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

/**
 * Decodes and validates a JWT token.
 *
 * @param string $token The JWT token
 * @param string $secret The signing secret key
 * @return array|null The payload data if valid, otherwise null
 */
function jwtDecode($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    
    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
    
    $signature = base64url_decode($base64UrlSignature);
    $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    
    if (!hash_equals($signature, $expectedSignature)) {
        return null;
    }
    
    $payload = json_decode(base64url_decode($base64UrlPayload), true);
    
    // Check if token has expired
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return null;
    }
    
    return $payload;
}
