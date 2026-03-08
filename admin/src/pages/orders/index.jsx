import FetchWrapper from 'components/FetchWrapper'
import Table from 'components/Table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import OrdersService from 'services/orders'

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`

const OrdersTable = ({ payload }) => {
  const navigate = useNavigate()
  const orders = Array.isArray(payload?.data || payload?.orders) ? payload?.data || payload?.orders : []

  const config = [
    { key: 'id', title: 'Nr zamowienia', onRender: (row) => `#${row.id}` },
    {
      key: 'createdAt',
      title: 'Data',
      onRender: (row) => dayjs(row?.createdAt).isValid() ? dayjs(row?.createdAt).format('DD.MM.YYYY') : '-',
    },
    { key: 'status', title: 'Status' },
    { key: 'paymentStatus', title: 'Platnosc' },
    { key: 'clientId', title: 'Klient' },
    { key: 'sellerId', title: 'Sprzedawca' },
    { key: 'totalGross', title: 'Brutto', onRender: (row) => formatPrice(row.totalGross) },
  ]

  return (
    <section className="adminPageSection">
      <Table config={config} data={orders} onRowClick={(row) => navigate(`/orders/${row.id}`)} />
    </section>
  )
}

const OrdersWrapper = () => (
  <FetchWrapper component={OrdersTable} name="AdminOrders" connector={OrdersService.getOrders} />
)

export default OrdersWrapper
