export const getOrdersTableConfig = () => {
  return [
    { key: 'orderNumber', title: 'Numer zamowienia' },
    { key: 'status', title: 'Status' },
    { key: 'paymentMethod', title: 'Platnosc' },
    { key: 'deliveryMethod', title: 'Dostawa' },
    { key: 'netValue', title: 'Netto' },
    { key: 'vatValue', title: 'VAT' },
    { key: 'grossValue', title: 'Brutto' },
    { key: 'discountValue', title: 'Rabat' },
    { key: 'currency', title: 'Waluta' },
    { key: 'created', title: 'Utworzono' },
    { key: 'notes', title: 'Notatki' },
  ]
}
