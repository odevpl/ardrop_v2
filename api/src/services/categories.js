const db = require("../config/db");

const SORT_FIELD_MAP = {
  id: "categories.id",
  name: "categories.name",
  position: "categories.position",
  createdAt: "categories.createdAt",
  updatedAt: "categories.updatedAt",
};

const normalizeCategoryPayload = (payload = {}) => {
  const name = String(payload.name || "").trim();
  if (!name) {
    const error = new Error("Category name is required");
    error.status = 400;
    throw error;
  }

  const slug = String(payload.slug || "").trim();
  if (!slug) {
    const error = new Error("Category slug is required");
    error.status = 400;
    throw error;
  }

  return {
    name,
    slug,
    parentId: payload.parentId ? Number(payload.parentId) : null,
    description: payload.description ? String(payload.description).trim() : null,
    isActive: payload.isActive === undefined ? 1 : (payload.isActive ? 1 : 0),
    position: Number.isFinite(Number(payload.position)) ? Number(payload.position) : 0,
    seoTitle: payload.seoTitle ? String(payload.seoTitle).trim() : null,
    seoDescription: payload.seoDescription ? String(payload.seoDescription).trim() : null,
  };
};

const ensureCategoryExists = async (categoryId) => {
  const category = await db("categories").select("*").where({ id: Number(categoryId) }).first();
  if (!category) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }
  return category;
};

const ensureSlugIsUnique = async ({ slug, excludeId = null, trx = db }) => {
  const query = trx("categories").where({ slug });
  if (excludeId) {
    query.andWhereNot("id", Number(excludeId));
  }
  const existing = await query.first();
  if (existing) {
    const error = new Error("Category slug already exists");
    error.status = 409;
    throw error;
  }
};

const ensureParentIsValid = async ({ parentId, categoryId = null, trx = db }) => {
  if (!parentId) return;
  if (categoryId && Number(parentId) === Number(categoryId)) {
    const error = new Error("Category cannot be its own parent");
    error.status = 400;
    throw error;
  }
  const parent = await trx("categories").select("id").where({ id: Number(parentId) }).first();
  if (!parent) {
    const error = new Error("Parent category not found");
    error.status = 400;
    throw error;
  }
};

const getCategoryAssignments = async (categoryIds) => {
  const safeIds = Array.isArray(categoryIds) ? categoryIds.map(Number).filter(Boolean) : [];
  if (safeIds.length === 0) return {};

  const rows = await db("product_categories")
    .innerJoin("products", "products.id", "product_categories.productId")
    .select(
      "product_categories.categoryId",
      "products.id",
      "products.name",
      "product_categories.isPrimary",
    )
    .whereIn("product_categories.categoryId", safeIds)
    .orderBy("product_categories.isPrimary", "desc")
    .orderBy("products.name", "asc");

  return rows.reduce((acc, row) => {
    const key = Number(row.categoryId);
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: Number(row.id),
      name: row.name,
      isPrimary: Number(row.isPrimary) === 1,
    });
    return acc;
  }, {});
};

const getImagesByCategoryIds = async (categoryIds) => {
  const safeIds = Array.isArray(categoryIds) ? categoryIds.map(Number).filter(Boolean) : [];
  if (safeIds.length === 0) return {};

  const rows = await db("categories_image")
    .select("id", "categoryId", "fileName", "alt", "isMain", "position", "createdAt")
    .whereIn("categoryId", safeIds)
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  return rows.reduce((acc, row) => {
    const key = Number(row.categoryId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
};

const attachHierarchyMeta = (category) => ({
  ...category,
  parentId: category.parentId ? Number(category.parentId) : null,
  level: 0,
  childrenCount: 0,
});

const buildCategoryTree = (categories = []) => {
  const byId = new Map();
  const roots = [];

  categories.forEach((category) => {
    byId.set(Number(category.id), {
      ...attachHierarchyMeta(category),
      children: [],
    });
  });

  byId.forEach((category) => {
    if (!category.parentId) {
      roots.push(category);
      return;
    }

    const parent = byId.get(Number(category.parentId));
    if (!parent) {
      roots.push(category);
      return;
    }

    category.level = parent.level + 1;
    parent.children.push(category);
  });

  const assignMeta = (nodes, level = 0) =>
    nodes.map((node) => {
      const children = assignMeta(
        [...node.children].sort((left, right) => {
          if (Number(left.position) !== Number(right.position)) {
            return Number(left.position) - Number(right.position);
          }
          return String(left.name || "").localeCompare(String(right.name || ""), "pl");
        }),
        level + 1,
      );

      return {
        ...node,
        level,
        children,
        childrenCount: children.length,
      };
    });

  return assignMeta(
    roots.sort((left, right) => {
      if (Number(left.position) !== Number(right.position)) {
        return Number(left.position) - Number(right.position);
      }
      return String(left.name || "").localeCompare(String(right.name || ""), "pl");
    }),
  );
};

const listCategories = async ({
  role,
  search,
  page = 1,
  limit = 50,
  sortBy = "position",
  sortOrder = "asc",
  parentId,
  activeOnly = false,
  view = "flat",
}) => {
  const normalizedPage = Number(page) > 0 ? Number(page) : 1;
  const maxLimit = view === "tree" ? 1000 : 200;
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), maxLimit) : 50;
  const normalizedSortBy = SORT_FIELD_MAP[sortBy] ? sortBy : "position";
  const normalizedSortOrder = String(sortOrder).toLowerCase() === "desc" ? "desc" : "asc";

  const query = db("categories");
  if (role === "CLIENT" || activeOnly) {
    query.where("categories.isActive", 1);
  }
  if (parentId === "root") {
    query.whereNull("categories.parentId");
  } else if (parentId !== undefined && parentId !== null && parentId !== "") {
    query.andWhere("categories.parentId", Number(parentId));
  }
  if (search) {
    query.andWhere((qb) => {
      qb.where("categories.name", "like", `%${search}%`)
        .orWhere("categories.slug", "like", `%${search}%`);
    });
  }

  const countRow = await query.clone().count({ total: "categories.id" }).first();
  const total = Number(countRow?.total || 0);
  const rows = await query
    .clone()
    .select("*")
    .orderBy(SORT_FIELD_MAP[normalizedSortBy], normalizedSortOrder)
    .orderBy("categories.name", "asc")
    .limit(normalizedLimit)
    .offset((normalizedPage - 1) * normalizedLimit);

  const categoryIds = rows.map((row) => Number(row.id));
  const imagesByCategoryId = await getImagesByCategoryIds(categoryIds);
  const assignmentsByCategoryId = await getCategoryAssignments(categoryIds);

  const data = rows.map((row) => ({
    ...row,
    parentId: row.parentId ? Number(row.parentId) : null,
    isActive: Boolean(row.isActive),
    images: imagesByCategoryId[Number(row.id)] || [],
    products: assignmentsByCategoryId[Number(row.id)] || [],
    productsCount: (assignmentsByCategoryId[Number(row.id)] || []).length,
  }));

  const tree = view === "tree" ? buildCategoryTree(data) : null;

  return {
    data,
    tree,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / normalizedLimit),
      hasNext: normalizedPage * normalizedLimit < total,
      hasPrev: normalizedPage > 1,
    },
  };
};

const getCategoryById = async ({ categoryId }) => {
  const category = await ensureCategoryExists(categoryId);
  const imagesByCategoryId = await getImagesByCategoryIds([Number(categoryId)]);
  const assignmentsByCategoryId = await getCategoryAssignments([Number(categoryId)]);

  return {
    ...category,
    isActive: Boolean(category.isActive),
    images: imagesByCategoryId[Number(category.id)] || [],
    products: assignmentsByCategoryId[Number(category.id)] || [],
  };
};

const createCategory = async ({ payload = {} }) => {
  const normalized = normalizeCategoryPayload(payload);
  await ensureParentIsValid({ parentId: normalized.parentId });
  await ensureSlugIsUnique({ slug: normalized.slug });

  const inserted = await db("categories").insert(normalized);
  const categoryId = Array.isArray(inserted) ? inserted[0] : inserted;
  return getCategoryById({ categoryId });
};

const updateCategory = async ({ categoryId, payload = {} }) => {
  await ensureCategoryExists(categoryId);
  const normalized = normalizeCategoryPayload(payload);
  await ensureParentIsValid({ parentId: normalized.parentId, categoryId });
  await ensureSlugIsUnique({ slug: normalized.slug, excludeId: categoryId });

  await db("categories")
    .where({ id: Number(categoryId) })
    .update({
      ...normalized,
      updatedAt: db.fn.now(),
    });

  return getCategoryById({ categoryId });
};

const deleteCategory = async ({ categoryId }) => {
  await ensureCategoryExists(categoryId);

  const child = await db("categories").select("id").where({ parentId: Number(categoryId) }).first();
  if (child) {
    const error = new Error("Nie mozna usunac kategorii posiadajacej podkategorie");
    error.status = 409;
    throw error;
  }

  const linkedProduct = await db("product_categories")
    .select("id")
    .where({ categoryId: Number(categoryId) })
    .first();
  if (linkedProduct) {
    const error = new Error("Nie mozna usunac kategorii przypisanej do produktow");
    error.status = 409;
    throw error;
  }

  const images = await db("categories_image")
    .select("fileName")
    .where({ categoryId: Number(categoryId) });
  await db.transaction(async (trx) => {
    await trx("categories_image").where({ categoryId: Number(categoryId) }).del();
    await trx("categories").where({ id: Number(categoryId) }).del();
  });

  return {
    id: Number(categoryId),
    deletedImages: images.map((image) => image.fileName),
  };
};

const assignProductCategories = async ({
  trx,
  productId,
  categoryIds = [],
  primaryCategoryId = null,
}) => {
  const safeCategoryIds = Array.isArray(categoryIds)
    ? [...new Set(categoryIds.map(Number).filter(Boolean))]
    : [];

  if (safeCategoryIds.length === 0) {
    await trx("product_categories").where({ productId: Number(productId) }).del();
    return;
  }

  const existingCategories = await trx("categories")
    .select("id")
    .whereIn("id", safeCategoryIds);
  if (existingCategories.length !== safeCategoryIds.length) {
    const error = new Error("One or more categories do not exist");
    error.status = 400;
    throw error;
  }

  const normalizedPrimaryCategoryId = primaryCategoryId ? Number(primaryCategoryId) : safeCategoryIds[0];
  if (!safeCategoryIds.includes(normalizedPrimaryCategoryId)) {
    const error = new Error("Primary category must be included in categoryIds");
    error.status = 400;
    throw error;
  }

  await trx("product_categories").where({ productId: Number(productId) }).del();
  for (const categoryId of safeCategoryIds) {
    await trx("product_categories").insert({
      productId: Number(productId),
      categoryId: Number(categoryId),
      isPrimary: Number(categoryId) === normalizedPrimaryCategoryId ? 1 : 0,
    });
  }
};

const getCategoriesForProductIds = async (productIds) => {
  const safeIds = Array.isArray(productIds) ? productIds.map(Number).filter(Boolean) : [];
  if (safeIds.length === 0) return {};

  const rows = await db("product_categories")
    .innerJoin("categories", "categories.id", "product_categories.categoryId")
    .select(
      "product_categories.productId",
      "categories.id",
      "categories.name",
      "categories.slug",
      "categories.parentId",
      "product_categories.isPrimary",
    )
    .whereIn("product_categories.productId", safeIds)
    .orderBy("product_categories.isPrimary", "desc")
    .orderBy("categories.position", "asc")
    .orderBy("categories.name", "asc");

  return rows.reduce((acc, row) => {
    const key = Number(row.productId);
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      parentId: row.parentId ? Number(row.parentId) : null,
      isPrimary: Number(row.isPrimary) === 1,
    });
    return acc;
  }, {});
};

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  assignProductCategories,
  getCategoriesForProductIds,
  buildCategoryTree,
};
