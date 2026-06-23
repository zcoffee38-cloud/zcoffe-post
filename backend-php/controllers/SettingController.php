<?php

class SettingController {
    /**
     * Retrieves all settings as a key-value dictionary object.
     */
    public function getAll() {
        $db = getDBConnection();
        $stmt = $db->query("SELECT `key`, `value` FROM settings");
        $rows = $stmt->fetchAll();
        
        $settingsMap = [];
        foreach ($rows as $row) {
            $settingsMap[$row['key']] = $row['value'];
        }
        
        sendSuccess('Settings retrieved successfully', $settingsMap);
    }

    /**
     * Updates multiple settings at once (performs MySQL upserts).
     */
    public function update() {
        $data = getRequestData();
        $settings = isset($data['settings']) ? $data['settings'] : null;

        if (!$settings || !is_array($settings)) {
            sendError('Invalid settings format. Expected an object.', 400);
        }

        $db = getDBConnection();
        $db->beginTransaction();

        try {
            foreach ($settings as $key => $value) {
                // Query to check if key already exists to preserve primary key ID
                $checkStmt = $db->prepare("SELECT id FROM settings WHERE `key` = ? LIMIT 1");
                $checkStmt->execute([$key]);
                $existingId = $checkStmt->fetchColumn();
                
                $id = $existingId ?: generateCuid();
                
                $stmt = $db->prepare("
                    INSERT INTO settings (`id`, `key`, `value`) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE `value` = ?
                ");
                $stmt->execute([$id, $key, strval($value), strval($value)]);
            }

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            sendError($e->getMessage(), 400);
        }

        // Retrieve and return the updated map
        $stmt = $db->query("SELECT `key`, `value` FROM settings");
        $rows = $stmt->fetchAll();
        $settingsMap = [];
        foreach ($rows as $row) {
            $settingsMap[$row['key']] = $row['value'];
        }
        
        sendSuccess('Settings updated successfully', $settingsMap);
    }
}
