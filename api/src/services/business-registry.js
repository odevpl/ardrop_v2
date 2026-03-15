const { getEnv } = require("../config/env");
const validator = require("../helpers/validator");
const { ceidgMapper, gusMapper } = require("./business-registry.mappers");

const SOAP_XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>';
const SOAP_CONTENT_TYPE = "application/soap+xml; charset=utf-8";

const decodeXml = (value) =>
  String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const xmlEscape = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const stripNamespace = (value) => String(value || "").replace(/^[^:]+:/, "");

const extractXmlTag = (xml, tagName) => {
  const normalizedTag = stripNamespace(tagName);
  const regex = new RegExp(
    `<(?:[\\w-]+:)?${normalizedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${normalizedTag}>`,
    "i",
  );
  const match = String(xml || "").match(regex);
  return match ? decodeXml(match[1]).trim() : "";
};

const parseFirstNode = (xml) => {
  const values = {};
  const match = String(xml || "").match(/<dane>([\s\S]*?)<\/dane>/i);
  if (!match) return values;

  match[1].replace(/<([^\/>\s]+)>([\s\S]*?)<\/\1>/g, (_, rawKey, rawValue) => {
    values[stripNamespace(rawKey)] = decodeXml(rawValue).trim();
    return _;
  });

  return values;
};

const chooseNonEmpty = (...values) =>
  values.find((value) => String(value || "").trim() !== "") || "";

const safeFetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const bodyText = await response.text();
  let body = null;

  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch (error) {
    body = bodyText;
  }

  if (!response.ok) {
    const error = new Error(`Registry provider request failed with status ${response.status}`);
    error.status = 502;
    error.details = body;
    throw error;
  }

  return body;
};

const safeFetchText = async (url, options = {}) => {
  const response = await fetch(url, options);
  const bodyText = await response.text();

  if (!response.ok) {
    const error = new Error(`Registry provider request failed with status ${response.status}`);
    error.status = 502;
    error.details = bodyText;
    throw error;
  }

  return bodyText;
};

const recursiveFind = (input, predicate) => {
  if (!input || typeof input !== "object") return null;

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = recursiveFind(item, predicate);
      if (found) return found;
    }
    return null;
  }

  if (predicate(input)) {
    return input;
  }

  for (const value of Object.values(input)) {
    const found = recursiveFind(value, predicate);
    if (found) return found;
  }

  return null;
};

const lookupCeidgByNip = async ({ nip, signal }) => {
  const env = getEnv();
  const token = env.businessRegistry.ceidgToken;
  if (!token) {
    return {
      provider: "ceidg",
      configured: false,
      data: null,
    };
  }

  const url = new URL(env.businessRegistry.ceidgBaseUrl);
  url.searchParams.set("nip", nip);

  const payload = await safeFetchJson(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  const entry = recursiveFind(payload, (item) => {
    const candidateNip = String(
      item?.nip || item?.Nip || item?.numerNip || item?.NumerNip || "",
    ).replace(/\D+/g, "");
    return candidateNip === nip;
  });

  if (!entry) {
    return {
      provider: "ceidg",
      configured: true,
      data: null,
    };
  }

  const mapped = ceidgMapper(entry.firmy ? entry : { firmy: [entry] });

  return {
    provider: "ceidg",
    configured: true,
    data: {
      ...mapped,
      nip: mapped.nip || nip,
      status: chooseNonEmpty(entry.status, entry.statusWpisu),
    },
  };
};

const buildSoapEnvelope = (body) => `${SOAP_XML_HEADER}
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    ${body}
  </soap12:Body>
</soap12:Envelope>`;

const gusSoapRequest = async ({ action, body, sid = "", signal }) => {
  const env = getEnv();
  return safeFetchText(env.businessRegistry.gusBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": SOAP_CONTENT_TYPE,
      SOAPAction: action,
      sid,
    },
    body: buildSoapEnvelope(body),
    signal,
  });
};

const gusLogin = async ({ signal }) => {
  const env = getEnv();
  const userKey = env.businessRegistry.gusUserKey;
  if (!userKey) return "";

  const xml = await gusSoapRequest({
    action: "http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/Zaloguj",
    body: `<Zaloguj xmlns="http://CIS/BIR/PUBL/2014/07"><pKluczUzytkownika>${xmlEscape(
      userKey,
    )}</pKluczUzytkownika></Zaloguj>`,
    signal,
  });

  return extractXmlTag(xml, "ZalogujResult");
};

const gusLogout = async ({ sid, signal }) => {
  if (!sid) return;
  try {
    await gusSoapRequest({
      action: "http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/Wyloguj",
      body: `<Wyloguj xmlns="http://CIS/BIR/PUBL/2014/07"><pIdentyfikatorSesji>${xmlEscape(
        sid,
      )}</pIdentyfikatorSesji></Wyloguj>`,
      sid,
      signal,
    });
  } catch (error) {
    // Ignore logout failures, the lookup data is already resolved.
  }
};

const gusSearchByNip = async ({ nip, sid, signal }) => {
  const xml = await gusSoapRequest({
    action: "http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/DaneSzukajPodmioty",
    body: `<DaneSzukajPodmioty xmlns="http://CIS/BIR/PUBL/2014/07" xmlns:dat="http://CIS/BIR/PUBL/2014/07/DataContract">
      <pParametryWyszukiwania>
        <dat:Nip>${xmlEscape(nip)}</dat:Nip>
      </pParametryWyszukiwania>
    </DaneSzukajPodmioty>`,
    sid,
    signal,
  });

  return parseFirstNode(extractXmlTag(xml, "DaneSzukajPodmiotyResult"));
};

const gusFetchReport = async ({ regon, reportName, sid, signal }) => {
  const xml = await gusSoapRequest({
    action: "http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/DanePobierzPelnyRaport",
    body: `<DanePobierzPelnyRaport xmlns="http://CIS/BIR/PUBL/2014/07">
      <pRegon>${xmlEscape(regon)}</pRegon>
      <pNazwaRaportu>${xmlEscape(reportName)}</pNazwaRaportu>
    </DanePobierzPelnyRaport>`,
    sid,
    signal,
  });

  return parseFirstNode(extractXmlTag(xml, "DanePobierzPelnyRaportResult"));
};

const lookupGusByNip = async ({ nip, signal }) => {
  const env = getEnv();
  if (!env.businessRegistry.gusUserKey) {
    return {
      provider: "gus",
      configured: false,
      data: null,
    };
  }

  const sid = await gusLogin({ signal });
  if (!sid) {
    throw Object.assign(new Error("GUS BIR login failed"), { status: 502 });
  }

  try {
    const summary = await gusSearchByNip({ nip, sid, signal });
    if (!summary.Regon && !summary.regon) {
      return {
        provider: "gus",
        configured: true,
        data: null,
      };
    }

    const regon = chooseNonEmpty(summary.Regon, summary.regon);
    const type = chooseNonEmpty(summary.Typ, summary.typ);
    let report = {};

    if (type === "P") {
      report = await gusFetchReport({
        regon,
        reportName: "BIR11OsPrawna",
        sid,
        signal,
      });
    } else {
      report = await gusFetchReport({
        regon,
        reportName: "BIR11OsFizycznaDzialalnoscCeidg",
        sid,
        signal,
      });

      if (Object.keys(report).length === 0) {
        report = await gusFetchReport({
          regon,
          reportName: "BIR11OsFizycznaDzialalnoscPozostala",
          sid,
          signal,
        });
      }
    }

    const mapped = gusMapper({
      Nazwa: summary.Nazwa || summary.nazwa || report.praw_nazwa || report.fiz_nazwa,
      Ulica:
        summary.Ulica ||
        summary.ulica ||
        report.praw_adSiedzUlica_Nazwa ||
        report.fiz_adSiedzUlica_Nazwa,
      NrNieruchomosci:
        summary.NrNieruchomosci ||
        summary.nrNieruchomosci ||
        report.praw_adSiedzNumerNieruchomosci ||
        report.fiz_adSiedzNumerNieruchomosci,
      NrLokalu:
        summary.NrLokalu ||
        summary.nrLokalu ||
        report.praw_adSiedzNumerLokalu ||
        report.fiz_adSiedzNumerLokalu,
      Miejscowosc:
        summary.Miejscowosc ||
        summary.miejscowosc ||
        report.praw_adSiedzMiejscowosc_Nazwa ||
        report.fiz_adSiedzMiejscowosc_Nazwa,
      KodPocztowy:
        summary.KodPocztowy ||
        summary.kodPocztowy ||
        report.praw_adSiedzKodPocztowy ||
        report.fiz_adSiedzKodPocztowy,
      Nip: summary.Nip || summary.nip || report.praw_nip || report.fiz_nip || nip,
      Regon: summary.Regon || summary.regon || regon,
    });

    return {
      provider: "gus",
      configured: true,
      data: {
        ...mapped,
        nip: mapped.nip || nip,
        regon: mapped.regon || regon,
        ownerName:
          mapped.ownerName ||
          chooseNonEmpty(
            `${String(report.fiz_imie1 || "").trim()} ${String(report.fiz_imie2 || "").trim()} ${String(
              report.fiz_nazwisko || "",
            ).trim()}`.trim(),
            report.fiz_nazwaSkrocona,
          ),
        status: chooseNonEmpty(report.praw_statusNip, report.fiz_statusNip, summary.StatusNip),
        raw: {
          summary,
          report,
        },
      },
    };
  } finally {
    await gusLogout({ sid, signal });
  }
};

const mergeBusinessData = ({ nip, ceidgData, gusData }) => {
  const primary = ceidgData || gusData;
  if (!primary) return null;

  return {
    nip,
    regon: chooseNonEmpty(ceidgData?.regon, gusData?.regon),
    companyName: chooseNonEmpty(ceidgData?.companyName, gusData?.companyName),
    ownerName: chooseNonEmpty(ceidgData?.ownerName, gusData?.ownerName),
    address: chooseNonEmpty(ceidgData?.address, gusData?.address),
    city: chooseNonEmpty(ceidgData?.city, gusData?.city),
    postalCode: chooseNonEmpty(ceidgData?.postalCode, gusData?.postalCode),
    status: chooseNonEmpty(ceidgData?.status, gusData?.status),
    sources: {
      ceidg: ceidgData || null,
      gus: gusData || null,
    },
  };
};

async function lookupBusinessByNip({ nip }) {
  const normalizedNip = validator.normalizeNip(nip);
  if (!validator.nip(normalizedNip)) {
    const error = new Error("Valid NIP is required");
    error.status = 400;
    throw error;
  }

  const env = getEnv();
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    env.businessRegistry.requestTimeoutMs,
  );

  try {
    const [ceidgResult, gusResult] = await Promise.allSettled([
      lookupCeidgByNip({ nip: normalizedNip, signal: controller.signal }),
      lookupGusByNip({ nip: normalizedNip, signal: controller.signal }),
    ]);

    const sources = {
      ceidg:
        ceidgResult.status === "fulfilled"
          ? ceidgResult.value
          : { provider: "ceidg", configured: true, data: null, error: ceidgResult.reason?.message },
      gus:
        gusResult.status === "fulfilled"
          ? gusResult.value
          : { provider: "gus", configured: true, data: null, error: gusResult.reason?.message },
    };

    const merged = mergeBusinessData({
      nip,
      ceidgData: sources.ceidg.data,
      gusData: sources.gus.data,
    });

    if (!merged) {
      const hasConfiguredProvider =
        Boolean(sources.ceidg.configured) || Boolean(sources.gus.configured);
      const error = new Error(
        hasConfiguredProvider
          ? "Business was not found in CEIDG or GUS"
          : "Business registry providers are not configured",
      );
      error.status = hasConfiguredProvider ? 404 : 503;
      error.sources = sources;
      throw error;
    }

    return {
      data: merged,
      sources,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  lookupBusinessByNip,
};
