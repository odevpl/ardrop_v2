-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 26, 2026 at 08:57 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/_!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT _/;
/_!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS _/;
/_!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION _/;
/_!40101 SET NAMES utf8mb4 _/;

--
-- Database: `ardrop2`
--

---

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
`id` int(10) UNSIGNED NOT NULL,
`clientId` int(10) UNSIGNED DEFAULT NULL,
`sessionToken` varchar(128) DEFAULT NULL,
`currency` varchar(10) NOT NULL DEFAULT 'PLN',
`status` enum('active','converted','abandoned') NOT NULL DEFAULT 'active',
`couponCode` varchar(64) DEFAULT NULL,
`shippingMethodId` int(10) UNSIGNED DEFAULT NULL,
`shippingNet` decimal(15,2) NOT NULL DEFAULT 0.00,
`shippingGross` decimal(15,2) NOT NULL DEFAULT 0.00,
`discountNet` decimal(15,2) NOT NULL DEFAULT 0.00,
`discountGross` decimal(15,2) NOT NULL DEFAULT 0.00,
`totalNet` decimal(15,2) NOT NULL DEFAULT 0.00,
`totalGross` decimal(15,2) NOT NULL DEFAULT 0.00,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
`expiresAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
`id` int(10) UNSIGNED NOT NULL,
`cartId` int(10) UNSIGNED NOT NULL,
`productId` int(10) UNSIGNED NOT NULL,
`variantId` int(10) UNSIGNED DEFAULT NULL,
`sellerId` int(10) UNSIGNED NOT NULL,
`quantity` int(11) NOT NULL DEFAULT 1,
`unitNet` decimal(15,2) NOT NULL,
`unitGross` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`lineNet` decimal(15,2) NOT NULL,
`lineGross` decimal(15,2) NOT NULL,
`productNameSnapshot` varchar(255) NOT NULL,
`variantNameSnapshot` varchar(255) DEFAULT NULL,
`variantAmountSnapshot` decimal(15,3) DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `cart_shipments`
--

CREATE TABLE `cart_shipments` (
`id` int(10) UNSIGNED NOT NULL,
`cartId` int(10) UNSIGNED NOT NULL,
`sellerId` int(11) NOT NULL,
`deliveryAddressId` int(11) DEFAULT NULL,
`shippingMethodName` varchar(120) DEFAULT NULL,
`shippingNet` decimal(15,2) NOT NULL DEFAULT 0.00,
`shippingGross` decimal(15,2) NOT NULL DEFAULT 0.00,
`clientNote` text DEFAULT NULL,
`estimatedDeliveryFrom` datetime DEFAULT NULL,
`estimatedDeliveryTo` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
`id` int(10) UNSIGNED NOT NULL,
`parentId` int(10) UNSIGNED DEFAULT NULL,
`name` varchar(180) NOT NULL,
`slug` varchar(180) NOT NULL,
`description` text DEFAULT NULL,
`isActive` tinyint(1) NOT NULL DEFAULT 1,
`position` int(11) NOT NULL DEFAULT 0,
`seoTitle` varchar(255) DEFAULT NULL,
`seoDescription` varchar(255) DEFAULT NULL,
`imageFileName` varchar(255) DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `categories_image`
--

CREATE TABLE `categories_image` (
`id` int(10) UNSIGNED NOT NULL,
`categoryId` int(10) UNSIGNED NOT NULL,
`fileName` varchar(255) NOT NULL,
`alt` varchar(255) DEFAULT NULL,
`isMain` tinyint(1) NOT NULL DEFAULT 0,
`position` int(11) NOT NULL DEFAULT 0,
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
`id` int(11) NOT NULL,
`userId` int(11) NOT NULL,
`name` varchar(255) NOT NULL,
`phone` varchar(30) DEFAULT NULL,
`companyName` varchar(255) DEFAULT NULL,
`nip` varchar(20) DEFAULT NULL,
`address` varchar(255) DEFAULT NULL,
`city` varchar(100) DEFAULT NULL,
`postalCode` varchar(20) DEFAULT NULL,
`createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
`updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `clients_delivery_address`
--

CREATE TABLE `clients_delivery_address` (
`id` int(11) NOT NULL,
`clientId` int(11) NOT NULL,
`label` varchar(100) DEFAULT NULL,
`recipientName` varchar(255) NOT NULL,
`phone` varchar(30) DEFAULT NULL,
`addressLine1` varchar(255) NOT NULL,
`addressLine2` varchar(255) DEFAULT NULL,
`city` varchar(100) NOT NULL,
`postalCode` varchar(20) NOT NULL,
`countryCode` varchar(2) NOT NULL DEFAULT 'PL',
`isDefault` tinyint(1) NOT NULL DEFAULT 0,
`createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
`updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `marketing_campaigns`
--

CREATE TABLE `marketing_campaigns` (
`id` int(10) UNSIGNED NOT NULL,
`name` varchar(180) NOT NULL,
`slug` varchar(180) NOT NULL,
`placement` enum('home_hero') NOT NULL DEFAULT 'home_hero',
`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
`layoutMode` enum('auto','hero','tiles') NOT NULL DEFAULT 'auto',
`startsAt` datetime DEFAULT NULL,
`endsAt` datetime DEFAULT NULL,
`priority` int(11) NOT NULL DEFAULT 100,
`showOnMobile` tinyint(1) NOT NULL DEFAULT 1,
`showOnTablet` tinyint(1) NOT NULL DEFAULT 1,
`showOnDesktop` tinyint(1) NOT NULL DEFAULT 1,
`maxItems` int(10) UNSIGNED NOT NULL DEFAULT 6,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `marketing_campaign_items`
--

CREATE TABLE `marketing_campaign_items` (
`id` int(10) UNSIGNED NOT NULL,
`campaignId` int(10) UNSIGNED NOT NULL,
`title` varchar(180) DEFAULT NULL,
`subtitle` varchar(255) DEFAULT NULL,
`imageFileName` varchar(255) NOT NULL,
`imageAlt` varchar(255) DEFAULT NULL,
`targetType` enum('url','product','category','custom') NOT NULL DEFAULT 'url',
`targetValue` varchar(500) NOT NULL,
`position` int(11) NOT NULL DEFAULT 0,
`isActive` tinyint(1) NOT NULL DEFAULT 1,
`startsAt` datetime DEFAULT NULL,
`endsAt` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
`id` int(10) UNSIGNED NOT NULL,
`orderGroupId` int(10) UNSIGNED NOT NULL,
`sellerId` int(10) UNSIGNED NOT NULL,
`clientId` int(10) UNSIGNED NOT NULL,
`deliveryAddressSnapshotJson` longtext DEFAULT NULL,
`shippingMethodName` varchar(120) DEFAULT NULL,
`clientNote` text DEFAULT NULL,
`estimatedDeliveryFrom` datetime DEFAULT NULL,
`estimatedDeliveryTo` datetime DEFAULT NULL,
`totalNet` decimal(15,2) NOT NULL,
`totalGross` decimal(15,2) NOT NULL,
`totalShipping` decimal(15,2) NOT NULL DEFAULT 0.00,
`paymentStatus` enum('pending','paid','failed') DEFAULT 'pending',
`status` enum('new','processing','shipped','completed','cancelled') DEFAULT 'new',
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
`id` int(10) UNSIGNED NOT NULL,
`orderId` int(10) UNSIGNED NOT NULL,
`orderGroupId` int(10) UNSIGNED NOT NULL,
`sellerId` int(10) UNSIGNED NOT NULL,
`productId` int(10) UNSIGNED NOT NULL,
`variantId` int(10) UNSIGNED DEFAULT NULL,
`productSnapshotJson` longtext DEFAULT NULL,
`variantNameSnapshot` varchar(255) DEFAULT NULL,
`variantAmountSnapshot` decimal(15,3) DEFAULT NULL,
`quantity` int(11) NOT NULL,
`netPrice` decimal(15,2) NOT NULL,
`grossPrice` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
`id` int(10) UNSIGNED NOT NULL,
`sellerId` int(10) UNSIGNED NOT NULL,
`name` varchar(255) NOT NULL,
`description` text DEFAULT NULL,
`netPrice` decimal(15,2) NOT NULL,
`grossPrice` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`unit` enum('pcs','g','l') NOT NULL DEFAULT 'pcs',
`stockQuantity` decimal(15,3) NOT NULL DEFAULT 0.000,
`hasVariants` tinyint(1) NOT NULL DEFAULT 0,
`status` enum('draft','active') DEFAULT 'draft',
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `products_image`
--

CREATE TABLE `products_image` (
`id` int(10) UNSIGNED NOT NULL,
`productId` int(10) UNSIGNED NOT NULL,
`fileName` varchar(255) NOT NULL,
`alt` varchar(255) DEFAULT NULL,
`isMain` tinyint(1) NOT NULL DEFAULT 0,
`position` int(11) NOT NULL DEFAULT 0,
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
`id` int(10) UNSIGNED NOT NULL,
`productId` int(10) UNSIGNED NOT NULL,
`categoryId` int(10) UNSIGNED NOT NULL,
`isPrimary` tinyint(1) NOT NULL DEFAULT 0,
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
`id` int(10) UNSIGNED NOT NULL,
`productId` int(10) UNSIGNED NOT NULL,
`sku` varchar(80) NOT NULL,
`name` varchar(120) NOT NULL,
`unit` enum('pcs','g','l') NOT NULL DEFAULT 'pcs',
`unitAmount` decimal(15,3) NOT NULL DEFAULT 1.000,
`netPrice` decimal(15,2) NOT NULL,
`grossPrice` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`stockQuantity` decimal(15,3) NOT NULL DEFAULT 0.000,
`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
`isDefault` tinyint(1) NOT NULL DEFAULT 0,
`position` int(11) NOT NULL DEFAULT 0,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `sellers`
--

CREATE TABLE `sellers` (
`id` int(11) NOT NULL,
`userId` int(11) NOT NULL,
`companyName` varchar(255) NOT NULL,
`nip` varchar(20) DEFAULT NULL,
`phone` varchar(30) DEFAULT NULL,
`address` varchar(255) DEFAULT NULL,
`city` varchar(100) DEFAULT NULL,
`postalCode` varchar(20) DEFAULT NULL,
`createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
`updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
`id` int(11) NOT NULL,
`email` varchar(255) NOT NULL,
`passwordHash` text NOT NULL,
`role` enum('ADMIN','SELLER','CLIENT') NOT NULL,
`isActive` tinyint(1) DEFAULT 1,
`createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
`updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `user_activation_tokens`
--

CREATE TABLE `user_activation_tokens` (
`id` int(10) UNSIGNED NOT NULL,
`userId` int(11) NOT NULL,
`tokenHash` char(64) NOT NULL,
`expiresAt` datetime NOT NULL,
`usedAt` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `user_password_reset_tokens`
--

CREATE TABLE `user_password_reset_tokens` (
`id` int(10) UNSIGNED NOT NULL,
`userId` int(11) NOT NULL,
`tokenHash` char(64) NOT NULL,
`expiresAt` datetime NOT NULL,
`usedAt` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
`id` int(10) UNSIGNED NOT NULL,
`sellerId` int(10) UNSIGNED NOT NULL,
`currency` varchar(10) NOT NULL DEFAULT 'PLN',
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `wallet_ledger`
--

CREATE TABLE `wallet_ledger` (
`id` int(10) UNSIGNED NOT NULL,
`walletId` int(10) UNSIGNED NOT NULL,
`sellerOrderId` int(10) UNSIGNED DEFAULT NULL,
`type` enum('order_income','commission_fee','payout','refund','manual_adjustment') NOT NULL,
`amount` decimal(15,2) NOT NULL,
`direction` enum('credit','debit') NOT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_cart_items_variant` (`variantId`);

--
-- Indexes for table `cart_shipments`
--
ALTER TABLE `cart_shipments`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniq_cart_shipments_cart_seller` (`cartId`,`sellerId`),
ADD KEY `idx_cart_shipments_cartId` (`cartId`),
ADD KEY `idx_cart_shipments_sellerId` (`sellerId`),
ADD KEY `idx_cart_shipments_deliveryAddressId` (`deliveryAddressId`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `ux_categories_slug` (`slug`),
ADD KEY `idx_categories_parent` (`parentId`),
ADD KEY `idx_categories_active_position` (`isActive`,`position`,`name`);

--
-- Indexes for table `categories_image`
--
ALTER TABLE `categories_image`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_categories_image_category` (`categoryId`),
ADD KEY `idx_categories_image_main` (`categoryId`,`isMain`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uq_clients_userId` (`userId`),
ADD KEY `idxClientsSellerId` (`userId`);

--
-- Indexes for table `clients_delivery_address`
--
ALTER TABLE `clients_delivery_address`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_cda_clientId` (`clientId`);

--
-- Indexes for table `marketing_campaigns`
--
ALTER TABLE `marketing_campaigns`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `ux_marketing_campaigns_slug` (`slug`);

--
-- Indexes for table `marketing_campaign_items`
--
ALTER TABLE `marketing_campaign_items`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_mkt_items_campaign` (`campaignId`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_order_items_variant` (`variantId`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products_image`
--
ALTER TABLE `products_image`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_products_image_product` (`productId`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `ux_product_categories_product_category` (`productId`,`categoryId`),
ADD KEY `idx_product_categories_category` (`categoryId`),
ADD KEY `idx_product_categories_product_primary` (`productId`,`isPrimary`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `ux_product_variants_sku` (`sku`),
ADD KEY `idx_product_variants_product` (`productId`),
ADD KEY `idx_product_variants_product_status` (`productId`,`status`);

--
-- Indexes for table `sellers`
--
ALTER TABLE `sellers`
ADD PRIMARY KEY (`id`),
ADD KEY `idxSellersUserId` (`userId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_activation_tokens`
--
ALTER TABLE `user_activation_tokens`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uq_uat_token_hash` (`tokenHash`),
ADD KEY `idx_uat_user_id` (`userId`);

--
-- Indexes for table `user_password_reset_tokens`
--
ALTER TABLE `user_password_reset_tokens`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uq_uprt_token_hash` (`tokenHash`),
ADD KEY `idx_uprt_user_id` (`userId`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `unique_wallet_seller` (`sellerId`);

--
-- Indexes for table `wallet_ledger`
--
ALTER TABLE `wallet_ledger`
ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_shipments`
--
ALTER TABLE `cart_shipments`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories_image`
--
ALTER TABLE `categories_image`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients_delivery_address`
--
ALTER TABLE `clients_delivery_address`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketing_campaigns`
--
ALTER TABLE `marketing_campaigns`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketing_campaign_items`
--
ALTER TABLE `marketing_campaign_items`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products_image`
--
ALTER TABLE `products_image`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sellers`
--
ALTER TABLE `sellers`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_activation_tokens`
--
ALTER TABLE `user_activation_tokens`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_password_reset_tokens`
--
ALTER TABLE `user_password_reset_tokens`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wallet_ledger`
--
ALTER TABLE `wallet_ledger`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
ADD CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `cart_shipments`
--
ALTER TABLE `cart_shipments`
ADD CONSTRAINT `fk_cart_shipments_cart` FOREIGN KEY (`cartId`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_cart_shipments_delivery_address` FOREIGN KEY (`deliveryAddressId`) REFERENCES `clients_delivery_address` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_cart_shipments_seller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`);

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parentId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `categories_image`
--
ALTER TABLE `categories_image`
ADD CONSTRAINT `fk_categories_image_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
ADD CONSTRAINT `fk_clients_userId_users_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `clients_delivery_address`
--
ALTER TABLE `clients_delivery_address`
ADD CONSTRAINT `fk_cda_clientId_clients_id` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `marketing_campaign_items`
--
ALTER TABLE `marketing_campaign_items`
ADD CONSTRAINT `fk_mkt_items_campaign` FOREIGN KEY (`campaignId`) REFERENCES `marketing_campaigns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
ADD CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_categories`
--
ALTER TABLE `product_categories`
ADD CONSTRAINT `fk_product_categories_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `fk_product_categories_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
ADD CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_activation_tokens`
--
ALTER TABLE `user_activation_tokens`
ADD CONSTRAINT `fk_uat_user_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_password_reset_tokens`
--
ALTER TABLE `user_password_reset_tokens`
ADD CONSTRAINT `fk_uprt_user_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/_!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT _/;
/_!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS _/;
/_!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION _/;
