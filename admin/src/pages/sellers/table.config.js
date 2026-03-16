export const getSellersTableConfig = () => {
  return [
    { key: 'companyName', title: 'Firma' },
    { key: 'nip', title: 'NIP' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Telefon' },
    { key: 'city', title: 'Miasto' },
    {
      key: 'isActive',
      title: 'Aktywny',
      onRender: (row) => (row.isActive ? 'Tak' : 'Nie'),
    },
  ]
}
