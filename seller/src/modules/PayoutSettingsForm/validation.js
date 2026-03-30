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
});
