import * as Yup from "yup";

export const SERVICE_TYPES = {
  dezynfekcja: "Dezynfekcja",
  dezynsekcja: "Dezynsekcja",
  deratyzacja: "Deratyzacja",
};

export const validationSchema = Yup.object({
  serviceType: Yup.string()
    .oneOf(Object.keys(SERVICE_TYPES), "Wybierz rodzaj uslugi.")
    .required("Rodzaj uslugi jest wymagany."),
  contactName: Yup.string()
    .trim()
    .min(2, "Podaj minimum 2 znaki.")
    .required("Imie i nazwisko jest wymagane."),
  companyName: Yup.string().trim(),
  phone: Yup.string()
    .trim()
    .min(9, "Podaj minimum 9 znakow.")
    .required("Telefon jest wymagany."),
  email: Yup.string()
    .trim()
    .email("Podaj poprawny email.")
    .required("Email jest wymagany."),
  addressLine: Yup.string().trim().required("Ulica i numer sa wymagane."),
  postalCode: Yup.string()
    .trim()
    .matches(/^\d{2}-\d{3}$/, "Kod pocztowy musi miec format XX-XXX.")
    .required("Kod pocztowy jest wymagany."),
  city: Yup.string().trim().required("Miasto jest wymagane."),
  area: Yup.number()
    .typeError("Powierzchnia musi byc liczba.")
    .positive("Powierzchnia musi byc wieksza od 0.")
    .required("Powierzchnia jest wymagana."),
  problemDescription: Yup.string()
    .trim()
    .min(10, "Opis musi miec minimum 10 znakow.")
    .required("Opis problemu jest wymagany."),
  preferredDate: Yup.string().nullable(),
  notes: Yup.string().trim(),
});
