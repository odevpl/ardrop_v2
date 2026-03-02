import { useMemo } from 'react'
import FetchWrapper from 'components/FetchWrapper'
import Table from 'components/Table'
import ProductsService from 'services/products'

const tableConfig = [
  { key: 'id', title: 'ID' },
  { key: 'name', title: 'Produkt' },
  { key: 'netPrice', title: 'Cena netto' },
  { key: 'grossPrice', title: 'Cena brutto' },
  { key: 'vatRate', title: 'VAT' },
  { key: 'status', title: 'Status' },
]

const ProductListView = ({ payload }) => {
  const products = payload?.products || []
  const preparedProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      netPrice: `${product.netPrice} zl`,
      grossPrice: `${product.grossPrice} zl`,
      vatRate: `${product.vatRate}%`,
    }))
  }, [products])

  return <Table config={tableConfig} data={preparedProducts} />
}

const ProductList = () => {
  return (
    <FetchWrapper
      name="ProductList"
      component={ProductListView}
      connector={ProductsService.getProducts}
    />
  )
}

export default ProductList
