const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toFixed(2)} zl`;
};

const formatEta = (minDays, maxDays) => {
  if (minDays === null || minDays === undefined || minDays === "") return "-";
  if (maxDays === null || maxDays === undefined || maxDays === "")
    return `${minDays} dni`;
  return `${minDays}-${maxDays} dni`;
};

const formatRegions = (regions) => {
  if (!Array.isArray(regions) || regions.length === 0) return "-";
  return regions.join(", ");
};

export const getShippingTableConfig = () => {
  return [
    { key: "name", title: "Metoda dostawy" },
    {
      key: "isActiveLabel",
      title: "Status",
    },
    {
      key: "priceGrossLabel",
      title: "Cena brutto",
      onRender: (row) => formatPrice(row?.priceGross),
    },
    {
      key: "etaLabel",
      title: "Dostawa",
      onRender: (row) => formatEta(row?.etaMinDays, row?.etaMaxDays),
    },
    {
      key: "regionsLabel",
      title: "Regiony",
      onRender: (row) => formatRegions(row?.regions),
    },
  ];
};
