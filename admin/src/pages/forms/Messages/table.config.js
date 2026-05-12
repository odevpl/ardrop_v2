const DDD_FIELDS = [
  { key: "serviceType", title: "Usluga" },
  { key: "contactName", title: "Kontakt" },
  { key: "phone", title: "Telefon" },
  { key: "email", title: "Email" },
  { key: "city", title: "Miasto" },
  { key: "area", title: "Pow. m2" },
];

const getDynamicFields = (rows) => {
  const keys = new Set();
  rows.forEach((row) => {
    Object.keys(row.dataJson || {}).forEach((key) => keys.add(key));
  });

  return [...keys].map((key) => ({
    key,
    title: key,
    onRender: (row) => row.dataJson?.[key] || "-",
  }));
};

export const getFormMessagesTableConfig = ({ formName, rows }) => {
  const fields =
    formName === "ddd"
      ? DDD_FIELDS.map((field) => ({
          ...field,
          onRender: (row) => row.dataJson?.[field.key] || "-",
        }))
      : getDynamicFields(rows);

  return [
    { key: "id", title: "ID" },
    {
      key: "createdAt",
      title: "Data",
      onRender: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString("pl-PL") : "-"),
    },
    ...fields,
  ];
};
