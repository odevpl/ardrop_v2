import FetchWrapper from 'components/FetchWrapper'
import Table from 'components/Table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import OrdersService from 'services/orders'

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`

const OrdersList = ({ payload }) => {
  const navigate = useNavigate()
  const orders = Array.isArray(payload?.data || payload?.orders) ? payload?.data || payload?.orders : []

  const tableConfig = [
    { key: 'id', title: 'Nr zamowienia', onRender: (row) => `#${row.id}` },
    {
      key: 'createdAt',
      title: 'Data',
      onRender: (row) => dayjs(row?.createdAt).isValid() ? dayjs(row?.createdAt).format('DD.MM.YYYY') : '-',
    },
    { key: 'status', title: 'Status' },
    { key: 'paymentStatus', title: 'Platnosc' },
    {
      key: 'itemsCount',
      title: 'Pozycje',
      onRender: (row) => row?.sellerScope?.itemsCount ?? row?.items?.length ?? '-',
    },
    {
      key: 'totalGross',
      title: 'Wartosc',
      onRender: (row) => formatPrice(row?.sellerScope?.totalGross ?? row?.totalGross),
    },
  ]

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Zamowienia</h2>
      </div>
      <Table config={tableConfig} data={orders} onRowClick={(row) => navigate(`/orders/${row.id}`)} />
    </section>
  )
}

const OrdersPage = () => (
  <FetchWrapper component={OrdersList} name="SellerOrders" connector={OrdersService.getOrders} />
)

export default OrdersPage
