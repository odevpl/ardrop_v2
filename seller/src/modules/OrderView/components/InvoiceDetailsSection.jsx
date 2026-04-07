import DetailsList from 'components/DetailsList'

const InvoiceDetailsSection = ({ client }) => {
  const items = client
    ? [
        {
          key: 'buyerName',
          label: 'Nabywca',
          value: client.companyName || client.name || '-',
        },
        { key: 'nip', label: 'NIP', value: client.nip || '-' },
        { key: 'phone', label: 'Telefon', value: client.phone || '-' },
        { key: 'address', label: 'Adres', value: client.address || '-' },
        {
          key: 'cityLine',
          label: 'Miasto i kod',
          value: `${client.postalCode || '-'} ${client.city || '-'}`,
        },
      ]
    : []

  return (
    <DetailsList
      title="Dane do faktury"
      items={items}
      emptyMessage="Brak danych do faktury dla tego zamowienia."
    />
  )
}

export default InvoiceDetailsSection
