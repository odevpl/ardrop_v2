import { useState } from 'react'
import ProductPickerStep from './ProductPickerStep'
import VariantPriceStep from './VariantPriceStep'

const SpecialPriceFormModal = ({ clientId, editedProduct, onClose, onSaved }) => {
  const [selectedProduct, setSelectedProduct] = useState(editedProduct || null)

  return (
    <div className="clientSpecialPricesModalBackdrop">
      <div className="clientSpecialPricesModal">
        <div className="adminToolbar">
          <h2>{editedProduct ? 'Edytuj cene specjalna' : 'Dodaj cene specjalna'}</h2>
          <button type="button" onClick={onClose}>
            Zamknij
          </button>
        </div>

        {selectedProduct ? (
          <VariantPriceStep
            clientId={clientId}
            product={selectedProduct}
            existingSpecialPrices={editedProduct?.variants || []}
            onBack={editedProduct ? null : () => setSelectedProduct(null)}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : (
          <ProductPickerStep onSelectProduct={setSelectedProduct} />
        )}
      </div>
    </div>
  )
}

export default SpecialPriceFormModal
