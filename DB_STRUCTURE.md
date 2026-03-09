-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 08, 2026 at 11:01 AM
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
`sellerId` int(10) UNSIGNED NOT NULL,
`quantity` int(11) NOT NULL DEFAULT 1,
`unitNet` decimal(15,2) NOT NULL,
`unitGross` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`lineNet` decimal(15,2) NOT NULL,
`lineGross` decimal(15,2) NOT NULL,
`productNameSnapshot` varchar(255) NOT NULL,
`createdAt` datetime NOT NULL DEFAULT current_timestamp(),
`updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
`id` int(36) NOT NULL,
`userId` int(36) NOT NULL,
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
`id` int(10) NOT NULL,
`clientId` int(36) NOT NULL,
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
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
`id` int(10) UNSIGNED NOT NULL,
`orderGroupId` int(10) UNSIGNED NOT NULL,
`sellerId` int(10) UNSIGNED NOT NULL,
`clientId` int(10) UNSIGNED NOT NULL,
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
`productSnapshotJson` longtext DEFAULT NULL,
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
-- Table structure for table `sellers`
--

CREATE TABLE `sellers` (
`id` int(36) NOT NULL,
`userId` int(36) NOT NULL,
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
`id` int(36) NOT NULL,
`email` varchar(255) NOT NULL,
`passwordHash` text NOT NULL,
`role` enum('ADMIN','SELLER','CLIENT') NOT NULL,
`isActive` tinyint(1) DEFAULT 1,
`createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
`updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
ADD PRIMARY KEY (`id`),
ADD KEY `idxClientsSellerId` (`userId`);

--
-- Indexes for table `clients_delivery_address`
--
ALTER TABLE `clients_delivery_address`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
MODIFY `id` int(36) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients_delivery_address`
--
ALTER TABLE `clients_delivery_address`
MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `sellers`
--
ALTER TABLE `sellers`
MODIFY `id` int(36) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
MODIFY `id` int(36) NOT NULL AUTO_INCREMENT;

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
COMMIT;

/_!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT _/;
/_!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS _/;
/_!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION _/;
