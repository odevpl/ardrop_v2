import FetchWrapper from 'components/FetchWrapper'
import Table from 'components/Table'
import dayjs from 'dayjs'
import FinanceService from 'services/finance'

const formatMoney = (value, currency = 'PLN') => `${Number(value || 0).toFixed(2)} ${currency}`

const mapTypeLabel = (value) => {
  if (value === 'order_income') return 'Zakup klienta'
  if (value === 'order_refund') return 'Zwrot'
  if (value === 'manual_adjustment') return 'Korekta'
  return value || '-'
}

const FinanceHistory = ({ payload, filters, setFilters }) => {
  const entries = Array.isArray(payload?.data) ? payload.data : []
  const pagination = payload?.meta?.pagination
  const monthlySummary = Array.isArray(payload?.summary?.monthly) ? payload.summary.monthly : []
  const currentMonthSummary = monthlySummary[0] || null

  const tableConfig = [
    {
      key: 'eventDate',
      title: 'Data',
      onRender: (row) =>
        dayjs(row?.eventDate).isValid() ? dayjs(row.eventDate).format('DD.MM.YYYY HH:mm') : '-',
    },
    { key: 'type', title: 'Typ', onRender: (row) => mapTypeLabel(row?.type) },
    {
      key: 'orderId',
      title: 'Zamowienie',
      onRender: (row) => (row?.orderId ? `#${row.orderId}` : '-'),
    },
    {
      key: 'settlementMonth',
      title: 'Miesiac',
    },
    {
      key: 'grossAmount',
      title: 'Kwota brutto',
      onRender: (row) => formatMoney(row?.grossAmount, row?.currency),
    },
    {
      key: 'notes',
      title: 'Opis',
      onRender: (row) => row?.notes || '-',
    },
  ]

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Finanse i rozliczenia</h2>
      </div>

      <div className="sellerConfigPlaceholder">
        <div className="sellerConfigPlaceholderItem">
          {currentMonthSummary
            ? `Biezacy miesiac ${currentMonthSummary.settlementMonth}: ${formatMoney(
                currentMonthSummary.totalGrossAmount,
                currentMonthSummary.currency,
              )} w ${currentMonthSummary.entriesCount} wpisach`
            : 'Brak historii finansowej dla sprzedawcy'}
        </div>
      </div>

      <Table
        config={tableConfig}
        data={entries}
        pagination={pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
      />
    </section>
  )
}

const FinancePage = () => (
  <FetchWrapper
    component={FinanceHistory}
    name="SellerFinanceHistory"
    connector={FinanceService.getFinancialHistory}
    filters={{ page: 1, limit: 20 }}
  />
)

export default FinancePage
