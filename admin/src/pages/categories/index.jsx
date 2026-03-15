import { useMemo } from "react";
import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { useNavigate } from "react-router-dom";
import CategoriesService from "services/categories";
import "./categories.scss";

const getTableConfig = () => [
  { key: "name", title: "Kategoria" },
  { key: "slug", title: "Slug" },
  { key: "parentLabel", title: "Rodzic" },
  { key: "productsCount", title: "Produkty" },
  { key: "statusLabel", title: "Status" },
];

const CategoriesList = ({ payload, filters, setFilters }) => {
  const navigate = useNavigate();
  const categories = Array.isArray(payload?.data) ? payload.data : [];
  const pagination = payload?.meta?.pagination;

  const categoryOptions = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {}),
    [categories],
  );

  const preparedData = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        parentLabel: category.parentId ? categoryOptions[category.parentId] || `#${category.parentId}` : "-",
        statusLabel: category.isActive ? "Aktywna" : "Ukryta",
      })),
    [categories, categoryOptions],
  );

  return (
    <section className="adminPageSection adminCategoriesPage">
      <div className="adminToolbar">
        <h2>Kategorie</h2>
        <div className="adminActions">
          <button
            type="button"
            className="adminPrimaryButton"
            onClick={() => navigate("/categories/add")}
          >
            Dodaj kategorie
          </button>
        </div>
      </div>

      <Table
        config={getTableConfig()}
        data={preparedData}
        onRowClick={(row) => navigate(`/categories/${row.id}`)}
        searchValue={filters?.search || ""}
        onSearchChange={(value) => setFilters({ ...filters, search: value, page: 1 })}
        pagination={pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onLimitChange={(limit) => setFilters({ ...filters, page: 1, limit })}
      />
    </section>
  );
};

const CategoriesPage = () => (
  <FetchWrapper
    component={CategoriesList}
    name="AdminCategories"
    connector={CategoriesService.getCategories}
    filters={{ page: 1, limit: 20, search: "" }}
  />
);

export default CategoriesPage;
