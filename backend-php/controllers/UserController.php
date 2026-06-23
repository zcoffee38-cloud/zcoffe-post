<?php

class UserController {
    /**
     * Retrieves users with pagination and search.
     */
    public function getAll() {
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        $pagination = getPagination($page, $limit);
        $skip = $pagination['skip'];
        
        $db = getDBConnection();
        
        // Count total matching records
        if (!empty($search)) {
            $countStmt = $db->prepare("SELECT COUNT(*) FROM users WHERE name LIKE ? OR email LIKE ?");
            $countStmt->execute(["%$search%", "%$search%"]);
            $queryStr = "SELECT id, name, email, role, created_at, updated_at FROM users WHERE name LIKE :search OR email LIKE :search ORDER BY name ASC LIMIT :limit OFFSET :offset";
        } else {
            $countStmt = $db->prepare("SELECT COUNT(*) FROM users");
            $countStmt->execute();
            $queryStr = "SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY name ASC LIMIT :limit OFFSET :offset";
        }
        $total = intval($countStmt->fetchColumn());
        
        $stmt = $db->prepare($queryStr);
        $stmt->bindValue(':limit', $pagination['limit'], PDO::PARAM_INT);
        $stmt->bindValue(':offset', $skip, PDO::PARAM_INT);
        if (!empty($search)) {
            $stmt->bindValue(':search', "%$search%", PDO::PARAM_STR);
        }
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        sendSuccess('Users retrieved successfully', $users, 200, [
            'page' => $pagination['page'],
            'limit' => $pagination['limit'],
            'total' => $total,
            'totalPages' => ceil($total / $pagination['limit'])
        ]);
    }

    /**
     * Creates a new user.
     */
    public function create() {
        $data = getRequestData();
        $name = isset($data['name']) ? trim($data['name']) : '';
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? $data['password'] : '';
        $role = isset($data['role']) ? trim($data['role']) : 'kasir';

        if (empty($name) || empty($email) || empty($password) || empty($role)) {
            sendError('All fields are required', 400);
        }

        if (!in_array($role, ['admin', 'kasir', 'owner'])) {
            sendError('Invalid user role', 400);
        }

        $db = getDBConnection();
        // Check if email exists
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $checkStmt->execute([$email]);
        if (intval($checkStmt->fetchColumn()) > 0) {
            sendError('Email already exists', 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $id = generateCuid();

        $stmt = $db->prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $name, $email, $hashedPassword, $role]);

        // Get created user
        $userStmt = $db->prepare("SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?");
        $userStmt->execute([$id]);
        $user = $userStmt->fetch();

        sendSuccess('User created successfully', $user, 201);
    }

    /**
     * Updates an existing user.
     */
    public function update($id) {
        $data = getRequestData();
        
        $db = getDBConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $existingUser = $stmt->fetch();

        if (!$existingUser) {
            sendError('User not found', 404);
        }

        $name = isset($data['name']) ? trim($data['name']) : $existingUser['name'];
        $email = isset($data['email']) ? trim($data['email']) : $existingUser['email'];
        $role = isset($data['role']) ? trim($data['role']) : $existingUser['role'];
        
        // Validate role if changing
        if (isset($data['role']) && !in_array($role, ['admin', 'kasir', 'owner'])) {
            sendError('Invalid user role', 400);
        }

        // Validate email uniqueness if changing
        if ($email !== $existingUser['email']) {
            $checkStmt = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
            $checkStmt->execute([$email]);
            if (intval($checkStmt->fetchColumn()) > 0) {
                sendError('Email already exists', 409);
            }
        }

        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?");
            $stmt->execute([$name, $email, $role, $hashedPassword, $id]);
        } else {
            $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?");
            $stmt->execute([$name, $email, $role, $id]);
        }

        // Get updated user
        $userStmt = $db->prepare("SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?");
        $userStmt->execute([$id]);
        $user = $userStmt->fetch();

        sendSuccess('User updated successfully', $user);
    }

    /**
     * Deletes a user.
     */
    public function delete($id) {
        $db = getDBConnection();
        
        // Prevent deleting yourself
        $currentUser = $_REQUEST['user'];
        if ($currentUser['userId'] === $id) {
            sendError('You cannot delete your own account', 400);
        }

        $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE id = ?");
        $stmt->execute([$id]);
        if (intval($stmt->fetchColumn()) === 0) {
            sendError('User not found', 404);
        }

        $deleteStmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $deleteStmt->execute([$id]);

        sendSuccess('User deleted successfully');
    }
}
