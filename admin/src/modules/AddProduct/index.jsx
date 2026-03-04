import AddProduct from './AddProduct'
import EditProduct from './EditProduct'

const ProductForm = ({ id }) => {
  if (id === undefined || id === null) {
    return <AddProduct />
  }

  return <EditProduct id={id} />
}

export default ProductForm
