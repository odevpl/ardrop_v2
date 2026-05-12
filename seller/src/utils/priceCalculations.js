export const roundCurrency = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";
  return (Math.round(numericValue * 100) / 100).toFixed(2);
};

export const calculateGrossFromNet = (netValue, vatRate) => {
  const net = Number(netValue);
  const vat = Number(vatRate);
  if (!Number.isFinite(net) || !Number.isFinite(vat)) return "";
  return roundCurrency(net * (1 + vat / 100));
};

export const calculateNetFromGross = (grossValue, vatRate) => {
  const gross = Number(grossValue);
  const vat = Number(vatRate);
  if (!Number.isFinite(gross) || !Number.isFinite(vat) || vat <= -100) return "";
  return roundCurrency(gross / (1 + vat / 100));
};
