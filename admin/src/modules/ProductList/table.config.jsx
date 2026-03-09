export const getProductsTableConfig = () => {
  return [
    { key: "id", title: "ID" },
    {
      key: "thumbnail",
      title: "Miniatura",
      onRender: (row) => {
        if (!row.thumbnailUrl) return "-";
        return (
          <img
            src={row.thumbnailUrl}
            alt={row.name || "Miniatura produktu"}
            loading="lazy"
            style={{
              width: "44px",
              height: "44px",
              objectFit: "cover",
              borderRadius: "6px",
              border: "1px solid #d9e3e9",
            }}
          />
        );
      },
    },
    { key: "name", title: "Produkt" },
    { key: "sellerCompanyName", title: "Firma" },
    { key: "netPrice", title: "Cena netto" },
    { key: "grossPrice", title: "Cena brutto" },
    { key: "vatRate", title: "VAT" },
    { key: "unitLabel", title: "Jedn." },
    { key: "stockQuantity", title: "Stan" },
    { key: "status", title: "Status" },
  ];
};
