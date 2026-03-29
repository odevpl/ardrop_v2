import DetailsList from 'components/DetailsList'

const DeliveryAddressSection = ({ address }) => {
  const items = address
    ? [
        { key: 'recipientName', label: 'Odbiorca', value: address.recipientName || '-' },
        { key: 'phone', label: 'Telefon', value: address.phone || '-' },
        { key: 'label', label: 'Etykieta', value: address.label || '-' },
        { key: 'addressLine1', label: 'Adres', value: address.addressLine1 || '-' },
        { key: 'addressLine2', label: 'Adres 2', value: address.addressLine2 || '-' },
        { key: 'cityLine', label: 'Miasto i kod', value: `${address.postalCode || '-'} ${address.city || '-'}` },
        { key: 'countryCode', label: 'Kraj', value: address.countryCode || 'PL' },
      ]
    : []

  return (
    <DetailsList
      title="Adres dostawy"
      items={items}
      emptyMessage="Brak snapshotu adresu dostawy w tym zamowieniu."
    />
  )
}

export default DeliveryAddressSection
