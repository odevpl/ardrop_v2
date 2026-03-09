import { useMemo } from "react";
import Table from "components/Table";
import { useNavigate } from "react-router-dom";
import { getProductsTableConfig } from "./table.config.jsx";

const normalizeImageUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const normalizedBase = String(baseUrl).replace(/\/+$/, "");
  const normalizedPath = String(url).startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
};

const formatUnit = (unit) => {
  if (unit === "g") return "g";
  if (unit === "l") return "l";
  return "szt.";
};

const ProductList = ({ payload, filters, setFilters }) => {
  const navigate = useNavigate();
  const products = payload?.data ?? payload?.products ?? [];
  const pagination = payload?.meta?.pagination;

  const preparedProducts = useMemo(() => {
    return products.map((product) => {
      const mainImage = Array.isArray(product.images)
        ? product.images.find((image) => image.isMain) || product.images[0]
        : null;

      return {
        ...product,
        vat: product.vat ?? product.vatRate,
        thumbnailUrl: normalizeImageUrl(mainImage?.thumbUrl),
        unitLabel: formatUnit(product.unit),
      };
    });
  }, [products]);

  return (
    <Table
      config={getProductsTableConfig()}
      data={preparedProducts}
      onRowClick={(row, options) => {
        const targetPath = `/products/${row.id}`
        if (options?.openInNewTab) {
          window.open(targetPath, "_blank", "noopener,noreferrer")
          return
        }
        navigate(targetPath)
      }}
      searchValue={filters?.search || ""}
      onSearchChange={(value) => setFilters({ ...filters, search: value, page: 1 })}
      pagination={pagination}
      onPageChange={(page) => setFilters({ ...filters, page })}
      onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
    />
  );
};

export default ProductList;
