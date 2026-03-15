function email(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(normalized);
}

function normalizeNip(value) {
  return String(value || "").replace(/\D+/g, "");
}

function nip(value) {
  const normalized = normalizeNip(value);
  if (!/^\d{10}$/.test(normalized)) {
    return false;
  }

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum = weights.reduce(
    (sum, weight, index) => sum + weight * Number(normalized[index]),
    0,
  );

  return checksum % 11 === Number(normalized[9]);
}

module.exports = {
  email,
  nip,
  normalizeNip,
};
