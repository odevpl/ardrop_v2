const firstValue = (value) => {
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }

  return String(value || "").trim();
};

const joinAddress = (...parts) =>
  parts
    .map((part) => firstValue(part))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+\/\s+/g, " / ")
    .replace(/\s+/g, " ")
    .trim();

const formatPostalCode = (value) => {
  const raw = firstValue(value).replace(/\D+/g, "");
  if (/^\d{5}$/.test(raw)) {
    return `${raw.slice(0, 2)}-${raw.slice(2)}`;
  }

  return firstValue(value);
};

const normalizeMappedCompany = (data, source, raw) => ({
  source,
  companyName: firstValue(data.companyName),
  ownerName: firstValue(data.clientName),
  address: firstValue(data.address),
  city: firstValue(data.city),
  postalCode: formatPostalCode(data.postalCode),
  country: firstValue(data.country) || "Polska",
  nip: firstValue(data.nip).replace(/\D+/g, ""),
  regon: firstValue(data.regon).replace(/\D+/g, ""),
  raw,
});

const gusMapper = (companyData = {}) => {
  const street = firstValue(companyData.Ulica || companyData.ulica);
  const buildingNumber = firstValue(companyData.NrNieruchomosci || companyData.nrNieruchomosci);
  const unitNumber = firstValue(companyData.NrLokalu || companyData.nrLokalu);
  const address = joinAddress(
    street,
    buildingNumber,
    unitNumber ? `/ ${unitNumber}` : "",
  );

  return normalizeMappedCompany(
    {
      companyName: companyData.Nazwa || companyData.nazwa,
      clientName: companyData.ClientName || companyData.clientName || "",
      address,
      city: companyData.Miejscowosc || companyData.miejscowosc,
      postalCode: companyData.KodPocztowy || companyData.kodPocztowy,
      country: companyData.Kraj || companyData.kraj || "Polska",
      nip: companyData.Nip || companyData.nip,
      regon: companyData.Regon || companyData.regon,
    },
    "gus",
    companyData,
  );
};

const ceidgMapper = (clientData = {}) => {
  const companyData = Array.isArray(clientData?.firmy) ? clientData.firmy[0] || {} : clientData;
  const owner = companyData.wlasciciel || {};
  const addressData = companyData.adresDzialalnosci || {};
  const address = joinAddress(
    addressData.ulica,
    addressData.budynek,
    addressData.lokal ? `/ ${addressData.lokal}` : "",
  );

  return normalizeMappedCompany(
    {
      companyName: companyData.nazwa || companyData.firma,
      clientName: `${firstValue(owner.imie)} ${firstValue(owner.nazwisko)}`.trim(),
      address,
      city: addressData.miasto || addressData.miejscowosc,
      postalCode: addressData.kod || addressData.kodPocztowy,
      country: addressData.kraj || "Polska",
      nip: owner.nip || companyData.nip,
      regon: owner.regon || companyData.regon,
    },
    "ceidg",
    clientData,
  );
};

module.exports = {
  gusMapper,
  ceidgMapper,
};
