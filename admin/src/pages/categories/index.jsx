import { useMemo, useState } from "react";
import FetchWrapper from "components/FetchWrapper";
import { useNavigate } from "react-router-dom";
import CategoriesService from "services/categories";
import "./categories.scss";

const flattenTree = (nodes = []) =>
  nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);

const filterTree = (nodes = [], searchTerm = "") => {
  const normalizedSearchTerm = String(searchTerm || "").trim().toLowerCase();
  if (!normalizedSearchTerm) {
    return nodes;
  }

  return nodes.reduce((acc, node) => {
    const children = filterTree(node.children || [], normalizedSearchTerm);
    const haystack = `${node.name || ""} ${node.slug || ""}`.toLowerCase();
    if (haystack.includes(normalizedSearchTerm) || children.length > 0) {
      acc.push({
        ...node,
        children,
      });
    }
    return acc;
  }, []);
};

const CategoryBranch = ({ nodes, onSelect }) => (
  <ol className="adminCategoriesTreeList">
    {nodes.map((category) => (
      <li key={category.id} className="adminCategoriesTreeItem">
        <button
          type="button"
          className="adminCategoriesTreeCard"
          onClick={() => onSelect(category)}
        >
          <span className="adminCategoriesTreeName">{category.name}</span>
          <span className="adminCategoriesTreeMeta">
            {category.slug}
            {category.isActive ? " | Aktywna" : " | Ukryta"}
            {category.productsCount ? ` | Produkty: ${category.productsCount}` : ""}
          </span>
        </button>
        {Array.isArray(category.children) && category.children.length > 0 ? (
          <CategoryBranch nodes={category.children} onSelect={onSelect} />
        ) : null}
      </li>
    ))}
  </ol>
);

const CategoriesList = ({ payload }) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const tree = Array.isArray(payload?.data) ? payload.data : [];

  const filteredTree = useMemo(() => filterTree(tree, searchValue), [tree, searchValue]);
  const visibleCount = useMemo(() => flattenTree(filteredTree).length, [filteredTree]);

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

      <section className="adminCategoriesTreePanel">
        <div className="adminCategoriesTreeToolbar">
          <input
            className="adminCategoriesTreeSearch"
            type="search"
            value={searchValue}
            placeholder="Szukaj po nazwie lub slug"
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <span className="adminCategoriesTreeCount">Widoczne: {visibleCount}</span>
        </div>

        {filteredTree.length === 0 ? (
          <div className="adminCategoriesTreeEmpty">Brak kategorii do wyswietlenia.</div>
        ) : (
          <CategoryBranch
            nodes={filteredTree}
            onSelect={(category) => navigate(`/categories/${category.id}`)}
          />
        )}
      </section>
    </section>
  );
};

const CategoriesPage = () => (
  <FetchWrapper
    component={CategoriesList}
    name="AdminCategories"
    connector={CategoriesService.getCategories}
    filters={{ page: 1, limit: 500, sortBy: "position", sortOrder: "asc", view: "tree" }}
  />
);

export default CategoriesPage;
