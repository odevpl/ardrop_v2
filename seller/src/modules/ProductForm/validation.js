import * as yup from 'yup'

export const STATUS_OPTIONS = {
  draft: 'Szkic',
  active: 'Aktywny',
  archived: 'Archiwalny',
}

export const UNIT_OPTIONS = {
  pcs: 'szt.',
  g: 'g',
  l: 'l',
}

export const addProductValidationSchema = yup.object({
  name: yup.string().trim().required('Nazwa jest wymagana'),
  description: yup.string().nullable(),
  netPrice: yup
    .number()
    .typeError('Cena netto musi byc liczba >= 0')
    .min(0, 'Cena netto musi byc liczba >= 0')
    .required('Cena netto musi byc liczba >= 0'),
  grossPrice: yup
    .number()
    .typeError('Cena brutto musi byc liczba >= 0')
    .min(0, 'Cena brutto musi byc liczba >= 0')
    .required('Cena brutto musi byc liczba >= 0'),
  vatRate: yup
    .number()
    .typeError('VAT musi byc liczba >= 0')
    .min(0, 'VAT musi byc liczba >= 0')
    .required('VAT musi byc liczba >= 0'),
  unit: yup
    .string()
    .oneOf(Object.keys(UNIT_OPTIONS), 'Nieprawidlowa jednostka')
    .required('Nieprawidlowa jednostka'),
  stockQuantity: yup
    .number()
    .typeError('Stan magazynowy musi byc liczba >= 0')
    .min(0, 'Stan magazynowy musi byc liczba >= 0')
    .required('Stan magazynowy musi byc liczba >= 0'),
  status: yup
    .string()
    .oneOf(Object.keys(STATUS_OPTIONS), 'Nieprawidlowy status')
    .required('Nieprawidlowy status'),
})
