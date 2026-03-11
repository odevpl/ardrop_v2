const db = require("../config/db");

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const normalizeQuantity = (quantity) => {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error("quantity must be a positive integer");
    error.status = 400;
    throw error;
  }
  return parsed;
};

const resolveScope = async ({ userId, role, clientId }) => {
  if (role === "CLIENT") {
    const client = await db("clients").select("id").where({ userId }).first();
    if (!client) {
      const error = new Error("Client profile not found");
      error.status = 404;
      throw error;
    }

    return {
      clientId: Number(client.id),
      sessionToken: null,
    };
  }

  const normalizedClientId = clientId ? Number(clientId) : null;

  if (!normalizedClientId) {
    const error = new Error("clientId is required for ADMIN");
    error.status = 400;
    throw error;
  }

  return {
    clientId: normalizedClientId,
    sessionToken: null,
  };
};

const findActiveCart = async ({ clientId }, trx = db) => {
  return trx("carts")
    .where({
      status: "active",
      clientId,
    })
    .orderBy("id", "desc")
    .first();
};

const createCart = async ({ clientId, currency = "PLN" }, trx = db) => {
  const inserted = await trx("carts").insert({
    clientId: clientId || null,
    sessionToken: null,
    currency: currency || "PLN",
    status: "active",
  });
  const cartId = Array.isArray(inserted) ? inserted[0] : inserted;
  return trx("carts").where({ id: cartId }).first();
};

const getCartByIdWithItems = async ({ cartId }, trx = db) => {
  const cart = await trx("carts").where({ id: cartId }).first();
  if (!cart) return null;

  const items = await trx("cart_items")
    .where({ cartId: Number(cartId) })
    .orderBy("id", "asc");

  return {
    ...cart,
    items,
  };
};

const recalculateTotals = async ({ cartId }, trx = db) => {
  const totalsRow = await trx("cart_items")
    .where({ cartId })
    .sum({ itemsNet: "lineNet", itemsGross: "lineGross" })
    .first();

  const cart = await trx("carts").where({ id: cartId }).first();
  if (!cart) return null;

  const itemsNet = roundMoney(totalsRow?.itemsNet || 0);
  const itemsGross = roundMoney(totalsRow?.itemsGross || 0);
  const shippingNet = roundMoney(cart.shippingNet || 0);
  const shippingGross = roundMoney(cart.shippingGross || 0);
  const discountNet = roundMoney(cart.discountNet || 0);
  const discountGross = roundMoney(cart.discountGross || 0);

  const totalNet = roundMoney(Math.max(0, itemsNet + shippingNet - discountNet));
  const totalGross = roundMoney(Math.max(0, itemsGross + shippingGross - discountGross));

  await trx("carts")
    .where({ id: cartId })
    .update({
      totalNet,
      totalGross,
      updatedAt: trx.fn.now(),
    });

  return getCartByIdWithItems({ cartId }, trx);
};

const getOrCreateCurrentCart = async ({
  userId,
  role,
  clientId,
  currency,
}) => {
  const scope = await resolveScope({ userId, role, clientId });
  let cart = await findActiveCart(scope);
  if (!cart) {
    cart = await createCart({ ...scope, currency: currency || "PLN" });
  }
  return getCartByIdWithItems({ cartId: cart.id });
};

const addItemToCurrentCart = async ({
  userId,
  role,
  clientId,
  currency,
  productId,
  variantId,
  quantity = 1,
}) => {
  const targetProductId = Number(productId);
  if (!targetProductId) {
    const error = new Error("productId is required");
    error.status = 400;
    throw error;
  }

  const normalizedQuantity = normalizeQuantity(quantity);
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    let cart = await findActiveCart(scope, trx);
    if (!cart) {
      cart = await createCart({ ...scope, currency: currency || "PLN" }, trx);
    }

    const product = await trx("products")
      .select("id", "sellerId", "name", "netPrice", "grossPrice", "vatRate", "status")
      .where({ id: targetProductId })
      .first();

    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    if (product.status !== "active") {
      const error = new Error("Only active products can be added to cart");
      error.status = 400;
      throw error;
    }

    const normalizedVariantId = variantId ? Number(variantId) : null;
    let selectedVariant = null;

    if (normalizedVariantId) {
      selectedVariant = await trx("product_variants")
        .select(
          "id",
          "productId",
          "name",
          "netPrice",
          "grossPrice",
          "vatRate",
          "stockQuantity",
          "status",
          "unit",
          "unitAmount",
        )
        .where({ id: normalizedVariantId, productId: targetProductId })
        .first();
      if (!selectedVariant) {
        const error = new Error("Selected variant not found");
        error.status = 404;
        throw error;
      }
    } else {
      selectedVariant = await trx("product_variants")
        .select(
          "id",
          "productId",
          "name",
          "netPrice",
          "grossPrice",
          "vatRate",
          "stockQuantity",
          "status",
          "unit",
          "unitAmount",
        )
        .where({ productId: targetProductId, isDefault: 1 })
        .first();
    }

    if (selectedVariant && selectedVariant.status !== "active") {
      const error = new Error("Selected variant is not active");
      error.status = 400;
      throw error;
    }

    const pricingSource = selectedVariant || product;
    const targetVariantId = selectedVariant ? Number(selectedVariant.id) : null;

    const existingItem = await trx("cart_items")
      .where({
        cartId: cart.id,
        productId: targetProductId,
      })
      .modify((query) => {
        if (targetVariantId) {
          query.andWhere("variantId", targetVariantId);
        } else {
          query.whereNull("variantId");
        }
      })
      .first();

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity) + normalizedQuantity;
      const unitNet = roundMoney(pricingSource.netPrice);
      const unitGross = roundMoney(pricingSource.grossPrice);
      const lineNet = roundMoney(unitNet * newQuantity);
      const lineGross = roundMoney(unitGross * newQuantity);

      await trx("cart_items")
        .where({ id: existingItem.id })
        .update({
          quantity: newQuantity,
          sellerId: Number(product.sellerId),
          unitNet,
          unitGross,
          vatRate: roundMoney(pricingSource.vatRate),
          lineNet,
          lineGross,
          productNameSnapshot: product.name,
          variantId: targetVariantId,
          variantNameSnapshot: selectedVariant?.name || null,
          variantAmountSnapshot: selectedVariant?.unitAmount || null,
          updatedAt: trx.fn.now(),
        });
    } else {
      const unitNet = roundMoney(pricingSource.netPrice);
      const unitGross = roundMoney(pricingSource.grossPrice);

      await trx("cart_items").insert({
        cartId: Number(cart.id),
        productId: targetProductId,
        variantId: targetVariantId,
        sellerId: Number(product.sellerId),
        quantity: normalizedQuantity,
        unitNet,
        unitGross,
        vatRate: roundMoney(pricingSource.vatRate),
        lineNet: roundMoney(unitNet * normalizedQuantity),
        lineGross: roundMoney(unitGross * normalizedQuantity),
        productNameSnapshot: product.name,
        variantNameSnapshot: selectedVariant?.name || null,
        variantAmountSnapshot: selectedVariant?.unitAmount || null,
      });
    }

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const updateCurrentCartItem = async ({
  userId,
  role,
  clientId,
  itemId,
  quantity,
}) => {
  const targetItemId = Number(itemId);
  if (!targetItemId) {
    const error = new Error("itemId is required");
    error.status = 400;
    throw error;
  }

  const normalizedQuantity = normalizeQuantity(quantity);
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const item = await trx("cart_items")
      .where({ id: targetItemId, cartId: cart.id })
      .first();

    if (!item) {
      const error = new Error("Cart item not found");
      error.status = 404;
      throw error;
    }

    const lineNet = roundMoney(Number(item.unitNet) * normalizedQuantity);
    const lineGross = roundMoney(Number(item.unitGross) * normalizedQuantity);

    await trx("cart_items")
      .where({ id: targetItemId })
      .update({
        quantity: normalizedQuantity,
        lineNet,
        lineGross,
        updatedAt: trx.fn.now(),
      });

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const removeItemFromCurrentCart = async ({
  userId,
  role,
  clientId,
  itemId,
}) => {
  const targetItemId = Number(itemId);
  if (!targetItemId) {
    const error = new Error("itemId is required");
    error.status = 400;
    throw error;
  }

  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const deletedCount = await trx("cart_items")
      .where({ id: targetItemId, cartId: cart.id })
      .del();

    if (!deletedCount) {
      const error = new Error("Cart item not found");
      error.status = 404;
      throw error;
    }

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const clearCurrentCart = async ({ userId, role, clientId }) => {
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    await trx("cart_items").where({ cartId: cart.id }).del();
    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const updateCurrentCartMeta = async ({
  userId,
  role,
  clientId,
  couponCode,
  shippingMethodId,
  shippingNet,
  shippingGross,
  discountNet,
  discountGross,
  expiresAt,
}) => {
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const updates = {};
    if (couponCode !== undefined) updates.couponCode = couponCode || null;
    if (shippingMethodId !== undefined) {
      updates.shippingMethodId = shippingMethodId ? Number(shippingMethodId) : null;
    }
    if (shippingNet !== undefined) updates.shippingNet = roundMoney(shippingNet);
    if (shippingGross !== undefined) updates.shippingGross = roundMoney(shippingGross);
    if (discountNet !== undefined) updates.discountNet = roundMoney(discountNet);
    if (discountGross !== undefined) updates.discountGross = roundMoney(discountGross);
    if (expiresAt !== undefined) updates.expiresAt = expiresAt || null;

    if (Object.keys(updates).length) {
      updates.updatedAt = trx.fn.now();
      await trx("carts").where({ id: cart.id }).update(updates);
    }

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

module.exports = {
  getOrCreateCurrentCart,
  addItemToCurrentCart,
  updateCurrentCartItem,
  removeItemFromCurrentCart,
  clearCurrentCart,
  updateCurrentCartMeta,
};
