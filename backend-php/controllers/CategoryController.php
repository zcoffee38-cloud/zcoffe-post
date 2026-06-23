<?php

class CategoryController {
    /**
     * Retrieves all categories with products count.
     */
    public function getAll() {
        $db = getDBConnection();
        $stmt = $db->query("
            SELECT c.id, c.name, c.created_at, COUNT(p.id) AS products_count 
            FROM categories c 
            LEFT JOIN products p ON c.id = p.category_id 
            GROUP BY c.id 
            ORDER BY c.name ASC
        ");
        $results = $stmt->fetchAll();
        
        $categories = [];
        foreach ($results as $row) {
            $categories[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'createdAt' => $row['created_at'],
                '_count' => [
                    'products' => intval($row['products_count'])
                ]
            ];
        }
        
        sendSuccess('Categories retrieved successfully', $categories);
    }

    /**
     * Creates a new category.
     */
    public function create() {
        $data = getRequestData();
        $name = isset($data['name']) ? trim($data['name']) : '';

        if (empty($name)) {
            sendError('Name is required', 400);
        }

        $db = getDBConnection();
        // Check if exists
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM categories WHERE name = ?");
        $checkStmt->execute([$name]);
        if (intval($checkStmt->fetchColumn()) > 0) {
            sendError('Category already exists', 409);
        }

        $id = generateCuid();
        $stmt = $db->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
        $stmt->execute([$id, $name]);

        // Get created category
        $catStmt = $db->prepare("SELECT id, name, created_at AS createdAt FROM categories WHERE id = ?");
        $catStmt->execute([$id]);
        $category = $catStmt->fetch();

        sendSuccess('Category created successfully', $category, 201);
    }

    /**
     * Updates category name.
     */
    public function update($id) {
        $data = getRequestData();
        $name = isset($data['name']) ? trim($data['name']) : '';

        if (empty($name)) {
            sendError('Name is required', 400);
        }

        $db = getDBConnection();
        // Check if category exists
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM categories WHERE id = ?");
        $checkStmt->execute([$id]);
        if (intval($checkStmt->fetchColumn()) === 0) {
            sendError('Category not found', 404);
        }

        // Check if name is taken by another category
        $nameCheck = $db->prepare("SELECT COUNT(*) FROM categories WHERE name = ? AND id != ?");
        $nameCheck->execute([$name, $id]);
        if (intval($nameCheck->fetchColumn()) > 0) {
            sendError('Category name already exists', 409);
        }

        $stmt = $db->prepare("UPDATE categories SET name = ? WHERE id = ?");
        $stmt->execute([$name, $id]);

        $catStmt = $db->prepare("SELECT id, name, created_at AS createdAt FROM categories WHERE id = ?");
        $catStmt->execute([$id]);
        $category = $catStmt->fetch();

        sendSuccess('Category updated successfully', $category);
    }

    /**
     * Deletes a category.
     */
    public function delete($id) {
        $db = getDBConnection();
        
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM categories WHERE id = ?");
        $checkStmt->execute([$id]);
        if (intval($checkStmt->fetchColumn()) === 0) {
            sendError('Category not found', 404);
        }

        // Check if products exist in this category
        $prodStmt = $db->prepare("SELECT COUNT(*) FROM products WHERE category_id = ?");
        $prodStmt->execute([$id]);
        if (intval($prodStmt->fetchColumn()) > 0) {
            sendError('Cannot delete category because it contains products', 400);
        }

        $deleteStmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        $deleteStmt->execute([$id]);

        sendSuccess('Category deleted successfully');
    }
}
