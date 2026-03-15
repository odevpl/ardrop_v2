import FetchWrapper from "components/FetchWrapper";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import CategoriesService from "services/categories";
import "./CategoriesView.scss";

const getMainImage = (category) => {
  if (!Array.isArray(category?.images)) return null;
  return category.images.find((image) => Number(image.isMain) === 1) || category.images[0] || null;
};

const CategoriesViewBody = ({ payload }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categories = useMemo(() => {
    const raw = Array.isArray(payload?.data) ? payload.data : [];
    return raw.filter((category) => Boolean(category?.isActive));
  }, [payload]);

  const selectedCategory = searchParams.get("category") || "";

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="categoriesView">
      <div className="categoriesViewTrack">
        {categories.map((category) => {
          const mainImage = getMainImage(category);
          const isActive = selectedCategory === String(category.name || "");

          return (
            <button
              key={category.id}
              type="button"
              className={`categoriesViewTile${isActive ? " categoriesViewTileActive" : ""}`}
              onClick={() => {
                const nextSearchParams = new URLSearchParams(searchParams);
                nextSearchParams.set("category", String(category.name || ""));
                nextSearchParams.delete("page");
                setSearchParams(nextSearchParams, { replace: false });
              }}
            >
              <div className="categoriesViewImageWrap">
                {mainImage?.thumbUrl || mainImage?.url ? (
                  <img
                    src={mainImage.thumbUrl || mainImage.url}
                    alt={mainImage.alt || category.name || "Kategoria"}
                    loading="lazy"
                  />
                ) : (
                  <div className="categoriesViewPlaceholder">{category.name}</div>
                )}
              </div>
              <span className="categoriesViewLabel">{category.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const CategoriesView = () => (
  <FetchWrapper
    name="CategoriesView"
    component={CategoriesViewBody}
    connector={CategoriesService.getCategories}
    filters={{ page: 1, limit: 24, activeOnly: 1, parentId: "root", sortBy: "position", sortOrder: "asc" }}
    syncSearchParams={false}
  />
);

export default CategoriesView;
