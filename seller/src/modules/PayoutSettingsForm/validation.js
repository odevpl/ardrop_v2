import * as yup from "yup";
import { normalizeBankAccount } from "./initialValues";

export const payoutSettingsValidationSchema = yup.object({
  payoutAccountHolder: yup.string().trim().required("Podaj nazwe odbiorcy przelewu"),
  payoutBankName: yup.string().trim().required("Podaj nazwe banku"),
  payoutBankAccount: yup
    .string()
    .required("Podaj numer rachunku")
    .test(
      "bank-account-format",
      "Numer rachunku musi zawierac dokladnie 26 cyfr",
      (value) => /^\d{26}$/.test(normalizeBankAccount(value)),
    ),
  paymentDueDays: yup
    .number()
    .transform((value, originalValue) => (String(originalValue || "").trim() === "" ? NaN : value))
    .integer("Podaj liczbe calkowita")
    .min(1, "Termin platnosci musi wynosic co najmniej 1 dzien")
    .max(365, "Termin platnosci nie moze przekraczac 365 dni")
    .required("Podaj termin platnosci w dniach"),
});
