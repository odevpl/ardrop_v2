export const EMPTY_PAYOUT_SETTINGS = {
  payoutAccountHolder: "",
  payoutBankAccount: "",
  payoutBankName: "",
};

export const normalizeBankAccount = (value) => String(value || "").replace(/\s+/g, "");

export const initialValues = (payload) => ({
  ...EMPTY_PAYOUT_SETTINGS,
  payoutAccountHolder: payload?.settings?.payoutAccountHolder || "",
  payoutBankAccount: payload?.settings?.payoutBankAccount || "",
  payoutBankName: payload?.settings?.payoutBankName || "",
});
