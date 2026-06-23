-- Z Coffee POS Seed Data

-- Insert Users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
('user_admin', 'Admin Z Coffee', 'admin@zcoffee.id', '$2y$10$8wT1Y6lWq5iK/pZqN6e2tO/Fw8.0vjC6Y3s.pYJ4i.2C6qE1m12uS', 'admin'),
('user_owner', 'Owner Z Coffee', 'owner@zcoffee.id', '$2y$10$8wT1Y6lWq5iK/pZqN6e2tO/Fw8.0vjC6Y3s.pYJ4i.2C6qE1m12uS', 'owner'),
('user_kasir', 'Kasir 1', 'kasir@zcoffee.id', '$2y$10$8wT1Y6lWq5iK/pZqN6e2tO/Fw8.0vjC6Y3s.pYJ4i.2C6qE1m12uS', 'kasir')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Insert Categories
INSERT INTO `categories` (`id`, `name`) VALUES
('cat_kopi', 'Kopi'),
('cat_nonkopi', 'Non-Kopi'),
('cat_makanan', 'Makanan'),
('cat_botol', 'Minuman Botol')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Insert Products
INSERT INTO `products` (`id`, `category_id`, `name`, `price`, `hpp`, `stock`, `is_available`) VALUES
('prod_americano', 'cat_kopi', 'Americano', 20000, 8000, 100, TRUE),
('prod_cappuccino', 'cat_kopi', 'Cappuccino', 25000, 10000, 100, TRUE),
('prod_latte', 'cat_kopi', 'Latte', 28000, 11000, 100, TRUE),
('prod_v60', 'cat_kopi', 'V60 Filter', 30000, 12000, 50, TRUE),
('prod_espresso', 'cat_kopi', 'Espresso', 18000, 7000, 100, TRUE),
('prod_matcha', 'cat_nonkopi', 'Matcha Latte', 28000, 10000, 80, TRUE),
('prod_chocolate', 'cat_nonkopi', 'Chocolate', 25000, 9000, 80, TRUE),
('prod_thaitea', 'cat_nonkopi', 'Thai Tea', 22000, 8000, 80, TRUE),
('prod_croissant', 'cat_makanan', 'Croissant', 20000, 10000, 30, TRUE),
('prod_sandwich', 'cat_makanan', 'Sandwich', 35000, 18000, 20, TRUE),
('prod_mineral', 'cat_botol', 'Air Mineral', 8000, 3000, 50, TRUE),
('prod_tehbotol', 'cat_botol', 'Teh Botol', 10000, 4000, 50, TRUE)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `price`=VALUES(`price`), `hpp`=VALUES(`hpp`), `stock`=VALUES(`stock`);

-- Insert Settings
INSERT INTO `settings` (`id`, `key`, `value`) VALUES
('set_name', 'shop_name', 'Z Coffee'),
('set_address', 'shop_address', 'Jl. Contoh Alamat Toko No. 123, Jakarta'),
('set_phone', 'shop_phone', '0812-3456-7890'),
('set_footer', 'receipt_footer', 'Terima kasih atas kunjungan Anda!')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);
