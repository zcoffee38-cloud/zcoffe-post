<?php

class AuthController {
    /**
     * Handles user login and generates a JWT.
     */
    public function login() {
        $data = getRequestData();
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (empty($email) || empty($password)) {
            sendError('Email and password are required', 400);
        }

        $db = getDBConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            sendError('Invalid email or password', 401);
        }

        // Generate JWT
        $payload = [
            'userId' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ];
        $token = jwtEncode($payload, JWT_SECRET);

        sendSuccess('Login successful', [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
    }

    /**
     * Retrieves the profile of the currently logged-in user.
     */
    public function getProfile() {
        $currentUser = $_REQUEST['user'];
        
        $db = getDBConnection();
        $stmt = $db->prepare("SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$currentUser['userId']]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError('User not found', 404);
        }

        sendSuccess('Profile retrieved successfully', $user);
    }
}
