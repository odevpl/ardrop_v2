const sortNodes = (nodes = []) =>
  [...nodes].sort((left, right) => {
    if (Number(left.position || 0) !== Number(right.position || 0)) {
      return Number(left.position || 0) - Number(right.position || 0);
    }
    return String(left.name || "").localeCompare(String(right.name || ""), "pl");
  });

const CategoryBranch = ({
  nodes,
  selectedCategoryIds,
  onToggle,
}) => (
  <ol className="adminCategoryTreeList">
    {sortNodes(nodes).map((category) => {
      const isSelected = selectedCategoryIds.includes(Number(category.id));
      const hasChildren = Array.isArray(category.children) && category.children.length > 0;

      return (
        <li key={category.id} className="adminCategoryTreeItem">
          <button
            type="button"
            className={`adminCategoryTreeCard${isSelected ? " adminCategoryTreeCardSelected" : ""}`}
            onClick={() => onToggle(category)}
          >
            <span className="adminCategoryTreeName">{category.name}</span>
            <span className="adminCategoryTreeMeta">{category.slug}</span>
          </button>
          {hasChildren ? (
            <CategoryBranch
              nodes={category.children}
              selectedCategoryIds={selectedCategoryIds}
              onToggle={onToggle}
            />
          ) : null}
        </li>
      );
    })}
  </ol>
);

const CategoryTreeSelector = ({
  categoryOptions = [],
  selectedCategoryIds = [],
  setSelectedCategoryIds,
  setPrimaryCategoryId,
}) => {
  const handleToggle = (category) => {
    const categoryId = Number(category.id);
    const isSelected = selectedCategoryIds.includes(categoryId);
    const normalizedSelectedIds = isSelected ? [] : [categoryId];

    setSelectedCategoryIds(normalizedSelectedIds);
    setPrimaryCategoryId(normalizedSelectedIds[0] || null);
  };

  if (!Array.isArray(categoryOptions) || categoryOptions.length === 0) {
    return <div className="adminCategoryTreeEmpty">Brak kategorii do wyboru.</div>;
  }

  return (
    <CategoryBranch
      nodes={categoryOptions}
      selectedCategoryIds={selectedCategoryIds}
      onToggle={handleToggle}
    />
  );
};

export default CategoryTreeSelector;
