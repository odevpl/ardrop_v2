export const getClientsTableConfig = () => {
  return [
    { key: 'name', title: 'Nazwa' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Telefon' },
    { key: 'nip', title: 'NIP' },
    { key: 'city', title: 'Miasto' },
    { key: 'address', title: 'Adres' },
    { key: 'postalCode', title: 'Kod pocztowy' },
    {
      key: 'isActive',
      title: 'Aktywny',
      onRender: (row) => (row.isActive ? 'Tak' : 'Nie'),
    },
  ]
}
