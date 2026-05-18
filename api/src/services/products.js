const db = require("../config/db");
const { assignProductCategories, getCategoriesForProductIds } = require("./categories");
const { deleteAllProductImages } = require("./product-images");
const campaignPricing = require("./campaign-pricing");

const PRODUCT_UNITS = ["pcs", "g", "l"];

const ALLOWED_SORT_FIELDS = ["id", "name", "netPrice", "grossPrice", "vatRate", "unit", "stockQuantity", "status", "createdAt", "updatedAt", "sellerCompanyName"];
const SORT_FIELD_MAP = {
  id: "products.id",
  name: "products.name",
  netPrice: "products.netPrice",
  grossPrice: "products.grossPrice",
  vatRate: "products.vatRate",
  unit: "products.unit",
  stockQuantity: "products.stockQuantity",
  status: "products.status",
  createdAt: "products.createdAt",
  updatedAt: "products.updatedAt",
  sellerCompanyName: "sellers.companyName",
};

const normalizeUnit = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!PRODUCT_UNITS.includes(normalized)) {
    const error = new Error(`Invalid unit. Allowed: ${PRODUCT_UNITS.join(", ")}`);
    error.status = 400;
    throw error;
  }

  return normalized;
};

const normalizeStockQuantity = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    const error = new Error("stockQuantity must be a number >= 0");
    error.status = 400;
    throw error;
  }

  return Number(numeric.toFixed(3));
};

const normalizeVariantUnitAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    const error = new Error("variant unitAmount must be a number > 0");
    error.status = 400;
    throw error;
  }
  return Number(numeric.toFixed(3));
};

const resolveSellerIdByUserId = async (userId) => {
  const seller = await db("sellers").select("id").where({ userId: Number(userId) }).first();
  if (!seller) {
    const error = new Error("Seller profile not found");
    error.status = 404;
    throw error;
  }
  return Number(seller.id);
};

const resolveClientIdByUserId = async (userId) => {
  const client = await db("clients").select("id").where({ userId: Number(userId) }).first();
  return client ? Number(client.id) : null;
};

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const applyClientSellerReadinessFilter = (query) => {
  query.whereExists(function hasActiveSellerUser() {
    this.select(db.raw("1"))
      .from("sellers as active_sellers")
      .innerJoin("users as active_seller_users", "active_sellers.userId", "active_seller_users.id")
      .whereRaw("active_sellers.id = products.sellerId")
      .where("active_seller_users.isActive", 1);
  });

  query.whereExists(function hasCompletePayoutAndShipping() {
    this.select(db.raw("1"))
      .from("seller_settings as ss")
      .whereRaw("ss.sellerId = products.sellerId")
      .whereNotNull("ss.payoutAccountHolder")
      .where("ss.payoutAccountHolder", "<>", "")
      .whereNotNull("ss.payoutBankAccount")
      .where("ss.payoutBankAccount", "<>", "")
      .whereNotNull("ss.payoutBankName")
      .where("ss.payoutBankName", "<>", "");
  });

  query.whereExists(function hasActiveShippingMethod() {
    this.select(db.raw("1"))
      .from("seller_shipping_methods as ssm")
      .whereRaw("ssm.sellerId = products.sellerId")
      .where("ssm.isActive", 1);
  });
};

const loadClientSpecialPricesByVariantIds = async ({ userId, role, variantIds }) => {
  if (role !== "CLIENT") return {};

  const clientId = await resolveClientIdByUserId(userId);
  const safeVariantIds = Array.isArray(variantIds)
    ? [...new Set(variantIds.map((variantId) => Number(variantId)).filter(Boolean))]
    : [];

  if (!clientId || safeVariantIds.length === 0) return {};

  const rows = await db("client_special_prices")
    .select(
      "variantId",
      "priceType",
      "specialNetPrice",
      "specialGrossPrice",
      "discountPercent",
    )
    .where({ clientId })
    .whereIn("variantId", safeVariantIds);

  return rows.reduce((acc, row) => {
    acc[Number(row.variantId)] = row;
    return acc;
  }, {});
};

const applyClientSpecialPricesToVariants = async ({ userId, role, variantsByProductId }) => {
  const variantIds = Object.values(variantsByProductId)
    .flat()
    .map((variant) => Number(variant.id));

  if (role !== "CLIENT") return variantsByProductId;

  const specialPricesByVariantId = await loadClientSpecialPricesByVariantIds({
    userId,
    role,
    variantIds,
  });

  const entries = await Promise.all(Object.entries(variantsByProductId).map(async ([productId, variants]) => {
    const mappedVariants = await Promise.all(variants.map(async (variant) => {
      const specialPrice = specialPricesByVariantId[Number(variant.id)];
      let pricedVariant = variant;

      if (specialPrice?.priceType === "amount") {
        pricedVariant = {
          ...variant,
          netPrice: roundMoney(specialPrice.specialNetPrice),
          grossPrice: roundMoney(specialPrice.specialGrossPrice),
          originalNetPrice: roundMoney(variant.netPrice),
          originalGrossPrice: roundMoney(variant.grossPrice),
          specialPriceType: specialPrice.priceType,
        };
      } else if (specialPrice?.priceType === "percent") {
        const multiplier = 1 - Number(specialPrice.discountPercent || 0) / 100;

        pricedVariant = {
          ...variant,
          netPrice: roundMoney(Number(variant.netPrice) * multiplier),
          grossPrice: roundMoney(Number(variant.grossPrice) * multiplier),
          originalNetPrice: roundMoney(variant.netPrice),
          originalGrossPrice: roundMoney(variant.grossPrice),
          specialPriceType: specialPrice.priceType,
          discountPercent: roundMoney(specialPrice.discountPercent),
        };
      }

      const campaignPrice = await campaignPricing.applyOpeningDiscount({
        netPrice: pricedVariant.netPrice,
        grossPrice: pricedVariant.grossPrice,
      });

      return {
        ...pricedVariant,
        netPrice: campaignPrice.netPrice,
        grossPrice: campaignPrice.grossPrice,
        originalNetPrice: pricedVariant.originalNetPrice ?? campaignPrice.originalNetPrice,
        originalGrossPrice: pricedVariant.originalGrossPrice ?? campaignPrice.originalGrossPrice,
        campaignDiscountPercent: campaignPrice.campaignDiscountPercent,
        campaignDiscountType: campaignPrice.campaignDiscountType,
      };
    }));

    return [Number(productId), mappedVariants];
  }));

  return entries.reduce((acc, [productId, variants]) => {
    acc[productId] = variants;
    return acc;
  }, {});
};

const applyClientCampaignPriceToProduct = async (product, role) => {
  if (role !== "CLIENT") return product;

  const campaignPrice = await campaignPricing.applyOpeningDiscount({
    netPrice: product.netPrice,
    grossPrice: product.grossPrice,
  });

  return {
    ...product,
    netPrice: campaignPrice.netPrice,
    grossPrice: campaignPrice.grossPrice,
    originalNetPrice: product.originalNetPrice ?? campaignPrice.originalNetPrice,
    originalGrossPrice: product.originalGrossPrice ?? campaignPrice.originalGrossPrice,
    campaignDiscountPercent: campaignPrice.campaignDiscountPercent,
    campaignDiscountType: campaignPrice.campaignDiscountType,
  };
};

const syncProductStatusWithVariants = async ({ trx, productId }) => {
  const normalizedProductId = Number(productId);
  if (!normalizedProductId) return;

  const product = await trx("products")
    .select("id", "status")
    .where({ id: normalizedProductId })
    .first();
  if (!product) return;

  if (product.status === "draft") {
    await trx("product_variants")
      .where({ productId: normalizedProductId })
      .update({ status: "draft", updatedAt: trx.fn.now() });
    return;
  }

  const activeVariant = await trx("product_variants")
    .select("id")
    .where({
      productId: normalizedProductId,
      status: "active",
    })
    .first();

  if (!activeVariant) {
    await trx("products")
      .where({ id: normalizedProductId })
      .update({
        status: "draft",
        updatedAt: trx.fn.now(),
      });
  }
};

const ensureUserCanManageProduct = async ({ userId, role, productId }) => {
  const product = await db("products").select("id", "sellerId").where({ id: Number(productId) }).first();
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    if (Number(product.sellerId) !== currentSellerId) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
  }

  return product;
};

const normalizeVariantPayload = (payload = {}, fallbackUnit = "pcs") => {
  const name = String(payload.name || "").trim();
  if (!name) {
    const error = new Error("Variant name is required");
    error.status = 400;
    throw error;
  }

  return {
    sku: String(payload.sku || "").trim() || null,
    name,
    unit: normalizeUnit(payload.unit || fallbackUnit),
    unitAmount: normalizeVariantUnitAmount(payload.unitAmount),
    netPrice: Number(payload.netPrice),
    grossPrice: Number(payload.grossPrice),
    vatRate: Number(payload.vatRate),
    stockQuantity: normalizeStockQuantity(payload.stockQuantity ?? 0),
    status: payload.status || "draft",
    isDefault: payload.isDefault ? 1 : 0,
    position: Number.isFinite(Number(payload.position)) ? Number(payload.position) : 0,
  };
};

const getVariantsByProductIds = async (productIds, { onlyActive = false } = {}) => {
  const safeIds = Array.isArray(productIds)
    ? productIds.map((id) => Number(id)).filter(Boolean)
    : [];
  if (safeIds.length === 0) return {};

  const rowsQuery = db("product_variants")
    .select(
      "id",
      "productId",
      "sku",
      "name",
      "unit",
      "unitAmount",
      "netPrice",
      "grossPrice",
      "vatRate",
      "stockQuantity",
      "status",
      "isDefault",
      "position",
      "createdAt",
      "updatedAt",
    )
    .whereIn("productId", safeIds);
  if (onlyActive) {
    rowsQuery.andWhere("status", "active");
  }

  const rows = await rowsQuery.orderBy("position", "asc").orderBy("id", "asc");

  return rows.reduce((acc, row) => {
    const key = Number(row.productId);
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      ...row,
      isDefault: Number(row.isDefault) === 1,
    });
    return acc;
  }, {});
};

const getCategoryIdsForFilter = async (categoryFilter) => {
  const normalizedFilter = String(categoryFilter || "").trim();
  if (!normalizedFilter) {
    return [];
  }

  const rootCategory = await db("categories")
    .select("id")
    .where((qb) => {
      qb.where("name", normalizedFilter).orWhere("slug", normalizedFilter);
    })
    .first();

  if (!rootCategory) {
    return [];
  }

  const categoryIds = new Set([Number(rootCategory.id)]);
  const queue = [Number(rootCategory.id)];

  while (queue.length > 0) {
    const parentIds = [...queue];
    queue.length = 0;

    const children = await db("categories")
      .select("id")
      .whereIn("parentId", parentIds);

    children.forEach((child) => {
      const childId = Number(child.id);
      if (categoryIds.has(childId)) {
        return;
      }
      categoryIds.add(childId);
      queue.push(childId);
    });
  }

  return [...categoryIds];
};

const getProducts = async ({
  userId,
  role,
  search,
  status,
  sellerId,
  category,
  page = 1,
  limit = 20,
  sortBy = "id",
  sortOrder = "desc",
}) => {
  const normalizedPage = Number(page) > 0 ? Number(page) : 1;
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 20;
  const normalizedSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "id";
  const normalizedSortOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

  const baseQuery = db("products")
    .leftJoin("sellers", "products.sellerId", "sellers.id");

  if (category) {
    const categoryIds = await getCategoryIdsForFilter(category);
    if (categoryIds.length === 0) {
      return {
        data: [],
        pagination: {
          page: normalizedPage,
          limit: normalizedLimit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: normalizedPage > 1,
        },
        sort: {
          by: normalizedSortBy,
          order: normalizedSortOrder,
        },
      };
    }

    baseQuery.whereExists(function applyCategoryFilter() {
      this.select(db.raw("1"))
        .from("product_categories")
        .whereRaw("product_categories.productId = products.id")
        .whereIn("product_categories.categoryId", categoryIds);
    });
  }

  if (role === "CLIENT") {
    baseQuery.where("products.status", "active");
    applyClientSellerReadinessFilter(baseQuery);
  } else if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    baseQuery.where("products.sellerId", currentSellerId);
  } else if (sellerId !== undefined) {
    baseQuery.where({ sellerId: Number(sellerId) });
  }

  if (search) {
    baseQuery.andWhere("name", "like", `%${search}%`);
  }

  if (status && role !== "CLIENT") {
    baseQuery.andWhere({ status });
  }

  const countRow = await baseQuery.clone().countDistinct({ total: "products.id" }).first();
  const total = Number(countRow?.total || 0);
  const offset = (normalizedPage - 1) * normalizedLimit;
  const sortColumn = SORT_FIELD_MAP[normalizedSortBy] || "products.id";

  const products = await baseQuery
    .clone()
    .select("products.*", "sellers.companyName as sellerCompanyName")
    .orderBy(sortColumn, normalizedSortOrder)
    .limit(normalizedLimit)
    .offset(offset);

  if (products.length === 0) {
    return {
      data: [],
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / normalizedLimit),
        hasNext: normalizedPage * normalizedLimit < total,
        hasPrev: normalizedPage > 1,
      },
      sort: {
        by: normalizedSortBy,
        order: normalizedSortOrder,
      },
    };
  }

  const productIds = products.map((product) => Number(product.id));
  const images = await db("products_image")
    .select("id", "productId", "fileName", "alt", "isMain", "position", "createdAt")
    .whereIn("productId", productIds)
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  const imagesByProductId = images.reduce((acc, image) => {
    const key = Number(image.productId);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(image);
    return acc;
  }, {});

  const data = products.map((product) => ({
    ...product,
    images: imagesByProductId[Number(product.id)] || [],
  }));

  const baseVariantsByProductId = await getVariantsByProductIds(
    data.map((product) => Number(product.id)),
    {
      onlyActive: role === "CLIENT",
    },
  );
  const variantsByProductId = await applyClientSpecialPricesToVariants({
    userId,
    role,
    variantsByProductId: baseVariantsByProductId,
  });
  const categoriesByProductId = await getCategoriesForProductIds(
    data.map((product) => Number(product.id)),
  );

  const normalizedData = await Promise.all(data.map(async (product) => ({
    ...(await applyClientCampaignPriceToProduct(product, role)),
    variants: variantsByProductId[Number(product.id)] || [],
    categories: categoriesByProductId[Number(product.id)] || [],
  })));

  return {
    data: normalizedData,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / normalizedLimit),
      hasNext: normalizedPage * normalizedLimit < total,
      hasPrev: normalizedPage > 1,
    },
    sort: {
      by: normalizedSortBy,
      order: normalizedSortOrder,
    },
  };
};

const getProductById = async ({ userId, role, productId }) => {
  const product = await db("products").select("*").where({ id: productId }).first();
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "CLIENT" && product.status !== "active") {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "CLIENT") {
    const sellerReady = await db("products")
      .where({ "products.id": Number(productId) })
      .modify(applyClientSellerReadinessFilter)
      .first("products.id");

    if (!sellerReady) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }
  }

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    if (Number(product.sellerId) !== currentSellerId) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
  }

  const images = await db("products_image")
    .select("id", "productId", "fileName", "alt", "isMain", "position", "createdAt")
    .where({ productId: Number(productId) })
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  const baseVariantsByProductId = await getVariantsByProductIds([Number(productId)], {
    onlyActive: role === "CLIENT",
  });
  const variantsByProductId = await applyClientSpecialPricesToVariants({
    userId,
    role,
    variantsByProductId: baseVariantsByProductId,
  });
  const categoriesByProductId = await getCategoriesForProductIds([Number(productId)]);

  return {
    ...(await applyClientCampaignPriceToProduct(product, role)),
    images,
    variants: variantsByProductId[Number(product.id)] || [],
    categories: categoriesByProductId[Number(product.id)] || [],
  };
};

const getSuggestedProducts = async ({ limit = 10, role, userId }) => {
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 20) : 10;

  const query = db("products")
    .select("products.*", "sellers.companyName as sellerCompanyName")
    .leftJoin("sellers", "products.sellerId", "sellers.id");

  if (role === "CLIENT") {
    query.where("products.status", "active");
    applyClientSellerReadinessFilter(query);
  }

  const products = await query.orderBy("products.id", "asc").limit(normalizedLimit);

  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => Number(product.id));
  const images = await db("products_image")
    .select("id", "productId", "fileName", "alt", "isMain", "position", "createdAt")
    .whereIn("productId", productIds)
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  const imagesByProductId = images.reduce((acc, image) => {
    const key = Number(image.productId);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(image);
    return acc;
  }, {});

  const baseVariantsByProductId = await getVariantsByProductIds(
    products.map((product) => Number(product.id)),
    {
      onlyActive: role === "CLIENT",
    },
  );
  const variantsByProductId = await applyClientSpecialPricesToVariants({
    userId,
    role,
    variantsByProductId: baseVariantsByProductId,
  });
  const categoriesByProductId = await getCategoriesForProductIds(
    products.map((product) => Number(product.id)),
  );

  return Promise.all(products.map(async (product) => ({
    ...(await applyClientCampaignPriceToProduct(product, role)),
    images: imagesByProductId[Number(product.id)] || [],
    variants: variantsByProductId[Number(product.id)] || [],
    categories: categoriesByProductId[Number(product.id)] || [],
  })));
};

const getLandingProducts = async ({ limit = 8 } = {}) => {
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 8) : 8;

  const products = await db("products")
    .select(
      "products.id",
      "products.name",
      "products.description",
      "products.netPrice",
      "products.grossPrice",
      "products.sellerId",
      "sellers.companyName as sellerCompanyName",
    )
    .innerJoin("sellers", "products.sellerId", "sellers.id")
    .innerJoin("users", "sellers.userId", "users.id")
    .where("products.status", "active")
    .where("users.isActive", 1)
    .whereExists(function hasActiveVariant() {
      this.select(db.raw("1"))
        .from("product_variants as pv")
        .whereRaw("pv.productId = products.id")
        .where("pv.status", "active");
    })
    .orderByRaw("RAND()")
    .limit(normalizedLimit);

  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => Number(product.id));
  const images = await db("products_image")
    .select("id", "productId", "fileName", "alt", "isMain", "position")
    .whereIn("productId", productIds)
    .orderByRaw("isMain desc")
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  const variants = await db("product_variants")
    .select("id", "productId", "name", "netPrice", "grossPrice", "isDefault", "position")
    .whereIn("productId", productIds)
    .where("status", "active")
    .orderByRaw("isDefault desc")
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  const imageByProductId = images.reduce((acc, image) => {
    const key = Number(image.productId);
    if (!acc[key]) acc[key] = image;
    return acc;
  }, {});

  const variantByProductId = variants.reduce((acc, variant) => {
    const key = Number(variant.productId);
    if (!acc[key]) acc[key] = variant;
    return acc;
  }, {});

  return products.map((product) => {
    const variant = variantByProductId[Number(product.id)] || null;
    const image = imageByProductId[Number(product.id)] || null;

    return {
      id: Number(product.id),
      title: product.name,
      description: product.description || "",
      netPrice: roundMoney(variant?.netPrice ?? product.netPrice),
      grossPrice: roundMoney(variant?.grossPrice ?? product.grossPrice),
      imageFileName: image?.fileName || null,
      imageAlt: image?.alt || product.name,
      sellerCompanyName: product.sellerCompanyName,
      variantId: variant ? Number(variant.id) : null,
      variantTitle: variant?.name || null,
    };
  });
};

const createProduct = async ({
  userId,
  role,
  sellerId,
  name,
  description,
  netPrice,
  grossPrice,
  vatRate,
  unit = "pcs",
  stockQuantity = 0,
  status,
  variants = [],
  categoryIds = [],
  primaryCategoryId = null,
}) => {
  let targetSellerId = sellerId !== undefined ? Number(sellerId) : null;

  if (role === "SELLER") {
    const seller = await db("sellers").select("id").where({ userId }).first();
    if (!seller) {
      const error = new Error("Seller profile not found");
      error.status = 404;
      throw error;
    }
    targetSellerId = seller.id;
  }

  if (!targetSellerId) {
    const error = new Error("sellerId is required");
    error.status = 400;
    throw error;
  }

  const normalizedUnit = normalizeUnit(unit);
  const providedVariants = Array.isArray(variants) ? variants : [];
  const inserted = await db.transaction(async (trx) => {
    const normalizedProductStatus = status || "draft";
    const result = await trx("products").insert({
      sellerId: targetSellerId,
      name: String(name || "").trim(),
      description: description || null,
      netPrice,
      grossPrice,
      vatRate,
      unit: normalizedUnit,
      stockQuantity: normalizeStockQuantity(stockQuantity),
      status: normalizedProductStatus,
    });
    const productId = Array.isArray(result) ? result[0] : result;

    if (providedVariants.length > 0) {
      const normalizedVariants = providedVariants.map((variant, index) => ({
        ...normalizeVariantPayload(variant, normalizedUnit),
        sku:
          String(variant?.sku || "").trim() ||
          `P${Number(productId)}-V${String(index + 1).padStart(3, "0")}`,
        isDefault: variant?.isDefault ? 1 : 0,
        position:
          Number.isFinite(Number(variant?.position)) ? Number(variant.position) : index,
      }));

      const hasDefault = normalizedVariants.some((variant) => variant.isDefault === 1);
      if (!hasDefault && normalizedVariants[0]) {
        normalizedVariants[0].isDefault = 1;
      }

      for (const variant of normalizedVariants) {
        await trx("product_variants").insert({
          productId: Number(productId),
          ...variant,
        });
      }
    } else {
      await trx("product_variants").insert({
        productId: Number(productId),
        sku: `P${Number(productId)}-DEF`,
        name: normalizedUnit === "pcs" ? "1 szt." : `1 ${normalizedUnit}`,
        unit: normalizedUnit,
        unitAmount: 1,
        netPrice: Number(netPrice),
        grossPrice: Number(grossPrice),
        vatRate: Number(vatRate),
        stockQuantity: normalizeStockQuantity(stockQuantity),
        status: normalizedProductStatus,
        isDefault: 1,
        position: 0,
      });
    }

    await assignProductCategories({
      trx,
      productId,
      categoryIds,
      primaryCategoryId,
    });

    await syncProductStatusWithVariants({ trx, productId });

    return productId;
  });
  const productId = inserted;

  return getProductById({ productId });
};

const getProductVariants = async ({ userId, role, productId }) => {
  const product = await ensureUserCanManageProduct({ userId, role, productId });

  const variants = await db("product_variants")
    .select("*")
    .where({ productId: Number(product.id) })
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  return variants.map((variant) => ({
    ...variant,
    isDefault: Number(variant.isDefault) === 1,
  }));
};

const createProductVariant = async ({ userId, role, productId, payload = {} }) => {
  const product = await ensureUserCanManageProduct({ userId, role, productId });
  const normalized = normalizeVariantPayload(payload, product.unit);

  const countRow = await db("product_variants")
    .count({ total: "id" })
    .where({ productId: Number(product.id) })
    .first();
  const nextIndex = Number(countRow?.total || 0) + 1;

  const sku = normalized.sku || `P${Number(product.id)}-V${String(nextIndex).padStart(3, "0")}`;
  const isDefault = payload.isDefault ? 1 : 0;

  await db.transaction(async (trx) => {
    if (isDefault) {
      await trx("product_variants").where({ productId: Number(product.id) }).update({ isDefault: 0 });
    }

    await trx("product_variants").insert({
      productId: Number(product.id),
      ...normalized,
      sku,
      isDefault,
    });

    if (normalized.status === "active") {
      await trx("products")
        .where({ id: Number(product.id) })
        .update({ status: "active", updatedAt: trx.fn.now() });
    } else {
      await syncProductStatusWithVariants({ trx, productId: product.id });
    }
  });

  return getProductVariants({ userId, role, productId });
};

const updateProductVariant = async ({ userId, role, productId, variantId, payload = {} }) => {
  const product = await ensureUserCanManageProduct({ userId, role, productId });
  const existing = await db("product_variants")
    .select("*")
    .where({ id: Number(variantId), productId: Number(product.id) })
    .first();

  if (!existing) {
    const error = new Error("Variant not found");
    error.status = 404;
    throw error;
  }

  const updates = { updatedAt: db.fn.now() };
  if (payload.name !== undefined) updates.name = String(payload.name || "").trim();
  if (payload.sku !== undefined) updates.sku = String(payload.sku || "").trim() || existing.sku;
  if (payload.unit !== undefined) updates.unit = normalizeUnit(payload.unit);
  if (payload.unitAmount !== undefined) updates.unitAmount = normalizeVariantUnitAmount(payload.unitAmount);
  if (payload.netPrice !== undefined) updates.netPrice = Number(payload.netPrice);
  if (payload.grossPrice !== undefined) updates.grossPrice = Number(payload.grossPrice);
  if (payload.vatRate !== undefined) updates.vatRate = Number(payload.vatRate);
  if (payload.stockQuantity !== undefined) updates.stockQuantity = normalizeStockQuantity(payload.stockQuantity);
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.position !== undefined) {
    updates.position = Number.isFinite(Number(payload.position)) ? Number(payload.position) : 0;
  }

  await db.transaction(async (trx) => {
    if (payload.isDefault === true) {
      await trx("product_variants").where({ productId: Number(product.id) }).update({ isDefault: 0 });
      updates.isDefault = 1;
    } else if (payload.isDefault === false) {
      updates.isDefault = 0;
    }

    await trx("product_variants")
      .where({ id: Number(variantId), productId: Number(product.id) })
      .update(updates);

    const defaults = await trx("product_variants")
      .count({ total: "id" })
      .where({ productId: Number(product.id), isDefault: 1 })
      .first();

    if (Number(defaults?.total || 0) === 0) {
      await trx("product_variants")
        .where({ productId: Number(product.id) })
        .orderBy("position", "asc")
        .orderBy("id", "asc")
        .limit(1)
        .update({ isDefault: 1 });
    }

    if (updates.status === "active") {
      await trx("products")
        .where({ id: Number(product.id) })
        .update({ status: "active", updatedAt: trx.fn.now() });
    } else {
      await syncProductStatusWithVariants({ trx, productId: product.id });
    }
  });

  return getProductVariants({ userId, role, productId });
};

const deleteProductVariant = async ({ userId, role, productId, variantId }) => {
  const product = await ensureUserCanManageProduct({ userId, role, productId });
  const existing = await db("product_variants")
    .select("id", "isDefault")
    .where({ id: Number(variantId), productId: Number(product.id) })
    .first();
  if (!existing) {
    const error = new Error("Variant not found");
    error.status = 404;
    throw error;
  }

  await db.transaction(async (trx) => {
    await trx("product_variants")
      .where({ id: Number(variantId), productId: Number(product.id) })
      .del();

    const remaining = await trx("product_variants")
      .count({ total: "id" })
      .where({ productId: Number(product.id) })
      .first();

    if (Number(remaining?.total || 0) === 0) {
      const error = new Error("Product must have at least one variant");
      error.status = 409;
      throw error;
    }

    const defaults = await trx("product_variants")
      .count({ total: "id" })
      .where({ productId: Number(product.id), isDefault: 1 })
      .first();

    if (Number(defaults?.total || 0) === 0) {
      await trx("product_variants")
        .where({ productId: Number(product.id) })
        .orderBy("position", "asc")
        .orderBy("id", "asc")
        .limit(1)
        .update({ isDefault: 1 });
    }

    await syncProductStatusWithVariants({ trx, productId: product.id });
  });

  return getProductVariants({ userId, role, productId });
};

const updateProduct = async ({ userId, role, productId, payload }) => {
  const existing = await db("products").select("id", "sellerId").where({ id: productId }).first();
  if (!existing) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    if (Number(existing.sellerId) !== currentSellerId) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
  }

  const updates = { updatedAt: db.fn.now() };

  if (payload.name !== undefined) {
    const normalizedName = String(payload.name || "").trim();
    if (!normalizedName) {
      const error = new Error("name is required");
      error.status = 400;
      throw error;
    }
    updates.name = normalizedName;
  }

  if (payload.description !== undefined) {
    updates.description = payload.description ? String(payload.description).trim() : null;
  }

  if (payload.netPrice !== undefined) {
    updates.netPrice = Number(payload.netPrice);
  }

  if (payload.grossPrice !== undefined) {
    updates.grossPrice = Number(payload.grossPrice);
  }

  if (payload.vatRate !== undefined) {
    updates.vatRate = Number(payload.vatRate);
  }

  if (payload.status !== undefined) {
    updates.status = payload.status;
  }

  if (payload.sellerId !== undefined && role === "ADMIN") {
    const normalizedSellerId = Number(payload.sellerId);
    if (!normalizedSellerId) {
      const error = new Error("sellerId must be a valid number");
      error.status = 400;
      throw error;
    }
    updates.sellerId = normalizedSellerId;
  }

  if (payload.unit !== undefined) {
    updates.unit = normalizeUnit(payload.unit);
  }

  if (payload.stockQuantity !== undefined) {
    updates.stockQuantity = normalizeStockQuantity(payload.stockQuantity);
  }

  await db.transaction(async (trx) => {
    await trx("products").where({ id: productId }).update(updates);

    if (updates.status === "draft") {
      await trx("product_variants")
        .where({ productId: Number(productId) })
        .update({ status: "draft", updatedAt: trx.fn.now() });
    } else {
      await syncProductStatusWithVariants({ trx, productId });
    }

    if (payload.categoryIds !== undefined || payload.primaryCategoryId !== undefined) {
      await assignProductCategories({
        trx,
        productId,
        categoryIds: payload.categoryIds || [],
        primaryCategoryId: payload.primaryCategoryId || null,
      });
    }
  });
  return getProductById({ userId, role, productId });
};

const deleteProduct = async ({ userId, role, productId }) => {
  const existing = await db("products").select("id", "sellerId").where({ id: productId }).first();
  if (!existing) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    if (Number(existing.sellerId) !== currentSellerId) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
  }

  const [orderItem, cartItem] = await Promise.all([
    db("order_items").select("id").where({ productId: Number(productId) }).first(),
    db("cart_items").select("id").where({ productId: Number(productId) }).first(),
  ]);

  if (orderItem || cartItem) {
    const error = new Error("Nie mozna usunac produktu, bo jest powiazany z zamowieniem lub koszykiem");
    error.status = 409;
    throw error;
  }

  await db.transaction(async (trx) => {
    await deleteAllProductImages({ productId, trx });
    await trx("product_variants").where({ productId: Number(productId) }).del();
    await trx("product_categories").where({ productId: Number(productId) }).del();
    await trx("products").where({ id: Number(productId) }).del();
  });

  return { id: productId };
};

module.exports = {
  getProducts,
  getSuggestedProducts,
  getLandingProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  PRODUCT_UNITS,
};
