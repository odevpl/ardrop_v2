-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql48.mydevil.net
-- Generation Time: Mar 29, 2026 at 05:17 PM
-- Server version: 8.0.43
-- PHP Version: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/_!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT _/;
/_!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS _/;
/_!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION _/;
/_!40101 SET NAMES utf8mb4 _/;

--
-- Database: `m1414_ardrop2`
--

---

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
`id` int UNSIGNED NOT NULL,
`clientId` int UNSIGNED DEFAULT NULL,
`sessionToken` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL,
`currency` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PLN',
`status` enum('active','converted','abandoned') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
`couponCode` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
`shippingMethodId` int UNSIGNED DEFAULT NULL,
`shippingNet` decimal(15,2) NOT NULL DEFAULT '0.00',
`shippingGross` decimal(15,2) NOT NULL DEFAULT '0.00',
`discountNet` decimal(15,2) NOT NULL DEFAULT '0.00',
`discountGross` decimal(15,2) NOT NULL DEFAULT '0.00',
`totalNet` decimal(15,2) NOT NULL DEFAULT '0.00',
`totalGross` decimal(15,2) NOT NULL DEFAULT '0.00',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`expiresAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
`id` int UNSIGNED NOT NULL,
`cartId` int UNSIGNED NOT NULL,
`productId` int UNSIGNED NOT NULL,
`variantId` int UNSIGNED DEFAULT NULL,
`sellerId` int UNSIGNED NOT NULL,
`quantity` int NOT NULL DEFAULT '1',
`unitNet` decimal(15,2) NOT NULL,
`unitGross` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`lineNet` decimal(15,2) NOT NULL,
`lineGross` decimal(15,2) NOT NULL,
`productNameSnapshot` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`variantNameSnapshot` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`variantAmountSnapshot` decimal(15,3) DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `cart_shipments`
--

CREATE TABLE `cart_shipments` (
`id` int UNSIGNED NOT NULL,
`cartId` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`deliveryAddressId` int DEFAULT NULL,
`shippingMethodId` int UNSIGNED DEFAULT NULL,
`shippingMethodName` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
`shippingNet` decimal(15,2) NOT NULL DEFAULT '0.00',
`shippingGross` decimal(15,2) NOT NULL DEFAULT '0.00',
`clientNote` text COLLATE utf8mb4_general_ci,
`estimatedDeliveryFrom` datetime DEFAULT NULL,
`estimatedDeliveryTo` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
`id` int UNSIGNED NOT NULL,
`parentId` int UNSIGNED DEFAULT NULL,
`name` varchar(180) COLLATE utf8mb4_general_ci NOT NULL,
`slug` varchar(180) COLLATE utf8mb4_general_ci NOT NULL,
`description` text COLLATE utf8mb4_general_ci,
`isActive` tinyint(1) NOT NULL DEFAULT '1',
`position` int NOT NULL DEFAULT '0',
`seoTitle` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`seoDescription` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`imageFileName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `categories_image`
--

CREATE TABLE `categories_image` (
`id` int UNSIGNED NOT NULL,
`categoryId` int UNSIGNED NOT NULL,
`fileName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`alt` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`isMain` tinyint(1) NOT NULL DEFAULT '0',
`position` int NOT NULL DEFAULT '0',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
`id` int NOT NULL,
`userId` int NOT NULL,
`name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
`companyName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`nip` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
`address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
`postalCode` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `clients_delivery_address`
--

CREATE TABLE `clients_delivery_address` (
`id` int NOT NULL,
`clientId` int NOT NULL,
`label` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
`recipientName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
`addressLine1` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`addressLine2` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`city` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
`postalCode` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
`countryCode` varchar(2) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PL',
`isDefault` tinyint(1) NOT NULL DEFAULT '0',
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `marketing_campaigns`
--

CREATE TABLE `marketing_campaigns` (
`id` int UNSIGNED NOT NULL,
`name` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
`slug` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
`placement` enum('home_hero') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'home_hero',
`status` enum('draft','active','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'draft',
`layoutMode` enum('auto','hero','tiles') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'auto',
`startsAt` datetime DEFAULT NULL,
`endsAt` datetime DEFAULT NULL,
`priority` int NOT NULL DEFAULT '100',
`showOnMobile` tinyint(1) NOT NULL DEFAULT '1',
`showOnTablet` tinyint(1) NOT NULL DEFAULT '1',
`showOnDesktop` tinyint(1) NOT NULL DEFAULT '1',
`maxItems` int UNSIGNED NOT NULL DEFAULT '6',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `marketing_campaign_items`
--

CREATE TABLE `marketing_campaign_items` (
`id` int UNSIGNED NOT NULL,
`campaignId` int UNSIGNED NOT NULL,
`title` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
`subtitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
`imageFileName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
`imageAlt` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
`targetType` enum('url','product','category','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'url',
`targetValue` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
`position` int NOT NULL DEFAULT '0',
`isActive` tinyint(1) NOT NULL DEFAULT '1',
`startsAt` datetime DEFAULT NULL,
`endsAt` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
`id` int UNSIGNED NOT NULL,
`orderGroupId` int UNSIGNED NOT NULL,
`orderGroupNumber` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
`sellerId` int UNSIGNED NOT NULL,
`clientId` int UNSIGNED NOT NULL,
`deliveryAddressSnapshotJson` longtext COLLATE utf8mb4_general_ci,
`shippingMethodId` int UNSIGNED DEFAULT NULL,
`shippingMethodName` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
`clientNote` text COLLATE utf8mb4_general_ci,
`estimatedDeliveryFrom` datetime DEFAULT NULL,
`estimatedDeliveryTo` datetime DEFAULT NULL,
`totalNet` decimal(15,2) NOT NULL,
`totalGross` decimal(15,2) NOT NULL,
`totalShipping` decimal(15,2) NOT NULL DEFAULT '0.00',
`paymentStatus` enum('pending','paid','failed') COLLATE utf8mb4_general_ci DEFAULT 'pending',
`status` enum('new','processing','shipped','completed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'new',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
`id` int UNSIGNED NOT NULL,
`orderId` int UNSIGNED NOT NULL,
`orderGroupId` int UNSIGNED NOT NULL,
`sellerId` int UNSIGNED NOT NULL,
`productId` int UNSIGNED NOT NULL,
`variantId` int UNSIGNED DEFAULT NULL,
`productSnapshotJson` longtext COLLATE utf8mb4_general_ci,
`variantNameSnapshot` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`variantAmountSnapshot` decimal(15,3) DEFAULT NULL,
`quantity` int NOT NULL,
`netPrice` decimal(15,2) NOT NULL,
`grossPrice` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
`id` int UNSIGNED NOT NULL,
`sellerId` int UNSIGNED NOT NULL,
`name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`description` text COLLATE utf8mb4_general_ci,
`netPrice` decimal(15,2) NOT NULL,
`grossPrice` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`unit` enum('pcs','g','l') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pcs',
`stockQuantity` decimal(15,3) NOT NULL DEFAULT '0.000',
`hasVariants` tinyint(1) NOT NULL DEFAULT '0',
`status` enum('draft','active') COLLATE utf8mb4_general_ci DEFAULT 'draft',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `products_image`
--

CREATE TABLE `products_image` (
`id` int UNSIGNED NOT NULL,
`productId` int UNSIGNED NOT NULL,
`fileName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`alt` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`isMain` tinyint(1) NOT NULL DEFAULT '0',
`position` int NOT NULL DEFAULT '0',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
`id` int UNSIGNED NOT NULL,
`productId` int UNSIGNED NOT NULL,
`categoryId` int UNSIGNED NOT NULL,
`isPrimary` tinyint(1) NOT NULL DEFAULT '0',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
`id` int UNSIGNED NOT NULL,
`productId` int UNSIGNED NOT NULL,
`sku` varchar(80) COLLATE utf8mb4_general_ci NOT NULL,
`name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
`unit` enum('pcs','g','l') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pcs',
`unitAmount` decimal(15,3) NOT NULL DEFAULT '1.000',
`netPrice` decimal(15,2) NOT NULL,
`grossPrice` decimal(15,2) NOT NULL,
`vatRate` decimal(5,2) NOT NULL,
`stockQuantity` decimal(15,3) NOT NULL DEFAULT '0.000',
`status` enum('draft','active','archived') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'draft',
`isDefault` tinyint(1) NOT NULL DEFAULT '0',
`position` int NOT NULL DEFAULT '0',
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `sellers`
--

CREATE TABLE `sellers` (
`id` int NOT NULL,
`userId` int NOT NULL,
`companyName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`nip` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
`phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
`address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
`postalCode` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_business_hours`
--

CREATE TABLE `seller_business_hours` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`dayOfWeek` tinyint UNSIGNED NOT NULL,
`isOpen` tinyint(1) NOT NULL DEFAULT '0',
`openTime` time DEFAULT NULL,
`closeTime` time DEFAULT NULL,
`note` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_discount_rules`
--

CREATE TABLE `seller_discount_rules` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`ruleType` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
`name` varchar(180) COLLATE utf8mb4_general_ci NOT NULL,
`isActive` tinyint(1) NOT NULL DEFAULT '1',
`configJson` longtext COLLATE utf8mb4_general_ci,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_financial_entries`
--

CREATE TABLE `seller_financial_entries` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`orderId` int UNSIGNED DEFAULT NULL,
`orderGroupId` int UNSIGNED DEFAULT NULL,
`type` enum('order_income','order_refund','manual_adjustment') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'order_income',
`eventDate` datetime NOT NULL,
`settlementMonth` char(7) COLLATE utf8mb4_general_ci NOT NULL,
`currency` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PLN',
`grossAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
`notes` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_holidays`
--

CREATE TABLE `seller_holidays` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`holidayDate` date NOT NULL,
`name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_return_policies`
--

CREATE TABLE `seller_return_policies` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`acceptsOnlineReturns` tinyint(1) NOT NULL DEFAULT '0',
`returnWindowDays` int UNSIGNED DEFAULT NULL,
`returnsAddressLine1` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`returnsAddressLine2` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`returnsCity` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
`returnsPostalCode` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
`returnsCountryCode` varchar(2) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PL',
`returnsInstruction` text COLLATE utf8mb4_general_ci,
`returnShippingPaidBy` enum('client','seller') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'client',
`hasSeparateComplaintProcess` tinyint(1) NOT NULL DEFAULT '0',
`complaintInstruction` text COLLATE utf8mb4_general_ci,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_sales_settings`
--

CREATE TABLE `seller_sales_settings` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`freeShippingThresholdGross` decimal(15,2) DEFAULT NULL,
`upsellMessageText` text COLLATE utf8mb4_general_ci,
`minimumOrderValueGross` decimal(15,2) DEFAULT NULL,
`crossSellProductIds` text COLLATE utf8mb4_general_ci,
`bundleOffersText` text COLLATE utf8mb4_general_ci,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_settings`
--

CREATE TABLE `seller_settings` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`orderSupportEmail` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`orderSupportPhone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
`returnsEmail` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`returnsPhone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
`defaultOrderPreparationDays` int UNSIGNED DEFAULT NULL,
`shippingWorkdays` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL,
`sameDayShippingCutoffTime` time DEFAULT NULL,
`vacationModeEnabled` tinyint(1) NOT NULL DEFAULT '0',
`vacationModeMessage` text COLLATE utf8mb4_general_ci,
`defaultMarkupPercent` decimal(8,2) DEFAULT NULL,
`minimumSalePriceGross` decimal(15,2) DEFAULT NULL,
`priceRoundingMode` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'none',
`defaultVatRate` decimal(5,2) DEFAULT NULL,
`defaultUnit` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pcs',
`customerResponseTimeText` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
`emailSignature` text COLLATE utf8mb4_general_ci,
`emailFooter` text COLLATE utf8mb4_general_ci,
`payoutAccountHolder` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`payoutBankAccount` varchar(34) COLLATE utf8mb4_general_ci DEFAULT NULL,
`payoutBankName` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
`paymentDueDays` int UNSIGNED DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_shipping_methods`
--

CREATE TABLE `seller_shipping_methods` (
`id` int UNSIGNED NOT NULL,
`sellerId` int NOT NULL,
`name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
`isActive` tinyint(1) NOT NULL DEFAULT '1',
`priceNet` decimal(15,2) DEFAULT NULL,
`priceGross` decimal(15,2) DEFAULT NULL,
`freeShippingAmountGross` decimal(15,2) DEFAULT NULL,
`freeShippingQuantity` int UNSIGNED DEFAULT NULL,
`freeShippingWeight` decimal(15,3) DEFAULT NULL,
`etaMinDays` int UNSIGNED DEFAULT NULL,
`etaMaxDays` int UNSIGNED DEFAULT NULL,
`countries` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`regions` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `seller_shipping_method_exclusions`
--

CREATE TABLE `seller_shipping_method_exclusions` (
`id` int UNSIGNED NOT NULL,
`sellerShippingMethodId` int UNSIGNED NOT NULL,
`productId` int UNSIGNED NOT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
`id` int NOT NULL,
`email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`passwordHash` text COLLATE utf8mb4_general_ci NOT NULL,
`role` enum('ADMIN','SELLER','CLIENT') COLLATE utf8mb4_general_ci NOT NULL,
`isActive` tinyint(1) DEFAULT '1',
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `user_activation_tokens`
--

CREATE TABLE `user_activation_tokens` (
`id` int UNSIGNED NOT NULL,
`userId` int NOT NULL,
`tokenHash` char(64) COLLATE utf8mb4_general_ci NOT NULL,
`expiresAt` datetime NOT NULL,
`usedAt` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `user_password_reset_tokens`
--

CREATE TABLE `user_password_reset_tokens` (
`id` int UNSIGNED NOT NULL,
`userId` int NOT NULL,
`tokenHash` char(64) COLLATE utf8mb4_general_ci NOT NULL,
`expiresAt` datetime NOT NULL,
`usedAt` datetime DEFAULT NULL,
`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
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
ADD KEY `idx_cart_items_variant` (`variantId`),
ADD KEY `idx_cart_items_cartId` (`cartId`),
ADD KEY `idx_cart_items_productId` (`productId`),
ADD KEY `idx_cart_items_sellerId` (`sellerId`);

--
-- Indexes for table `cart_shipments`
--
ALTER TABLE `cart_shipments`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniq_cart_shipments_cart_seller` (`cartId`,`sellerId`),
ADD KEY `idx_cart_shipments_cartId` (`cartId`),
ADD KEY `idx_cart_shipments_sellerId` (`sellerId`),
ADD KEY `idx_cart_shipments_deliveryAddressId` (`deliveryAddressId`),
ADD KEY `idx_cart_shipments_shippingMethodId` (`shippingMethodId`);

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
ADD PRIMARY KEY (`id`),
ADD KEY `idx_orders_clientId` (`clientId`),
ADD KEY `idx_orders_sellerId` (`sellerId`),
ADD KEY `idx_orders_orderGroupId` (`orderGroupId`),
ADD KEY `idx_orders_orderGroupNumber` (`orderGroupNumber`),
ADD KEY `idx_orders_shippingMethodId` (`shippingMethodId`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_order_items_variant` (`variantId`),
ADD KEY `idx_order_items_orderId` (`orderId`),
ADD KEY `idx_order_items_orderGroupId` (`orderGroupId`),
ADD KEY `idx_order_items_sellerId` (`sellerId`),
ADD KEY `idx_order_items_productId` (`productId`);

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
-- Indexes for table `seller_business_hours`
--
ALTER TABLE `seller_business_hours`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniqSellerBusinessHoursSellerDay` (`sellerId`,`dayOfWeek`);

--
-- Indexes for table `seller_discount_rules`
--
ALTER TABLE `seller_discount_rules`
ADD PRIMARY KEY (`id`),
ADD KEY `idxSellerDiscountRulesSellerId` (`sellerId`);

--
-- Indexes for table `seller_financial_entries`
--
ALTER TABLE `seller_financial_entries`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniqSellerFinancialEntriesOrderType` (`orderId`,`type`),
ADD KEY `idxSellerFinancialEntriesSellerDate` (`sellerId`,`eventDate`),
ADD KEY `idxSellerFinancialEntriesSellerMonth` (`sellerId`,`settlementMonth`);

--
-- Indexes for table `seller_holidays`
--
ALTER TABLE `seller_holidays`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniqSellerHolidayDate` (`sellerId`,`holidayDate`);

--
-- Indexes for table `seller_return_policies`
--
ALTER TABLE `seller_return_policies`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniqSellerReturnPoliciesSellerId` (`sellerId`);

--
-- Indexes for table `seller_sales_settings`
--
ALTER TABLE `seller_sales_settings`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniqSellerSalesSettingsSellerId` (`sellerId`);

--
-- Indexes for table `seller_settings`
--
ALTER TABLE `seller_settings`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniqSellerSettingsSellerId` (`sellerId`);

--
-- Indexes for table `seller_shipping_methods`
--
ALTER TABLE `seller_shipping_methods`
ADD PRIMARY KEY (`id`),
ADD KEY `idxSellerShippingMethodsSellerId` (`sellerId`);

--
-- Indexes for table `seller_shipping_method_exclusions`
--
ALTER TABLE `seller_shipping_method_exclusions`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `uniqSellerShippingMethodProduct` (`sellerShippingMethodId`,`productId`),
ADD KEY `idxSellerShippingMethodExclusionsProductId` (`productId`);

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
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_shipments`
--
ALTER TABLE `cart_shipments`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories_image`
--
ALTER TABLE `categories_image`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients_delivery_address`
--
ALTER TABLE `clients_delivery_address`
MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketing_campaigns`
--
ALTER TABLE `marketing_campaigns`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketing_campaign_items`
--
ALTER TABLE `marketing_campaign_items`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products_image`
--
ALTER TABLE `products_image`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sellers`
--
ALTER TABLE `sellers`
MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_business_hours`
--
ALTER TABLE `seller_business_hours`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_discount_rules`
--
ALTER TABLE `seller_discount_rules`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_financial_entries`
--
ALTER TABLE `seller_financial_entries`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_holidays`
--
ALTER TABLE `seller_holidays`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_return_policies`
--
ALTER TABLE `seller_return_policies`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_sales_settings`
--
ALTER TABLE `seller_sales_settings`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_settings`
--
ALTER TABLE `seller_settings`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_shipping_methods`
--
ALTER TABLE `seller_shipping_methods`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_shipping_method_exclusions`
--
ALTER TABLE `seller_shipping_method_exclusions`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_activation_tokens`
--
ALTER TABLE `user_activation_tokens`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_password_reset_tokens`
--
ALTER TABLE `user_password_reset_tokens`
MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

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
ADD CONSTRAINT `fk_cart_shipments_shipping_method` FOREIGN KEY (`shippingMethodId`) REFERENCES `seller_shipping_methods` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_cart_shipments_seller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE RESTRICT;

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
-- Constraints for table `seller_business_hours`
--
ALTER TABLE `seller_business_hours`
ADD CONSTRAINT `fkSellerBusinessHoursSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_discount_rules`
--
ALTER TABLE `seller_discount_rules`
ADD CONSTRAINT `fkSellerDiscountRulesSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_financial_entries`
--
ALTER TABLE `seller_financial_entries`
ADD CONSTRAINT `fkSellerFinancialEntriesOrder` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fkSellerFinancialEntriesSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_holidays`
--
ALTER TABLE `seller_holidays`
ADD CONSTRAINT `fkSellerHolidaysSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_return_policies`
--
ALTER TABLE `seller_return_policies`
ADD CONSTRAINT `fkSellerReturnPoliciesSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_sales_settings`
--
ALTER TABLE `seller_sales_settings`
ADD CONSTRAINT `fkSellerSalesSettingsSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_settings`
--
ALTER TABLE `seller_settings`
ADD CONSTRAINT `fkSellerSettingsSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_shipping_methods`
--
ALTER TABLE `seller_shipping_methods`
ADD CONSTRAINT `fkSellerShippingMethodsSeller` FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_shipping_method_exclusions`
--
ALTER TABLE `seller_shipping_method_exclusions`
ADD CONSTRAINT `fkSellerShippingMethodExclusionsMethod` FOREIGN KEY (`sellerShippingMethodId`) REFERENCES `seller_shipping_methods` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fkSellerShippingMethodExclusionsProduct` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

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
