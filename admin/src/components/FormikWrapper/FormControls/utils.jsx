export const sanitizeQuantity = (newQuantity) => {
  if (newQuantity === "") {
    return "";
  }

  // Pozwól na wprowadzanie kropek i przecinków bez natychmiastowej walidacji
  if (newQuantity.endsWith(".") || newQuantity.endsWith(",")) {
    return newQuantity;
  }

  let preparedNumber = newQuantity.replace(",", ".");

  preparedNumber = parseFloat(preparedNumber);

  if (!isNaN(preparedNumber) && preparedNumber >= 0) {
    return preparedNumber;
  }

  return null;
};
