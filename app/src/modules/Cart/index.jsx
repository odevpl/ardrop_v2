import { useEffect, useMemo, useState } from 'react'
import CartsService from 'services/carts'
import './Cart.scss'

const formatPrice = (value) => {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return '-'
  return `${numericValue.toFixed(2)} zl`
}

const Cart = () => {
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingItemId, setPendingItemId] = useState(null)

  const fetchCart = async () => {
    setIsLoading(true)
    setError('')
    const response = await CartsService.getCurrentCart()

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || 'Nie udalo sie pobrac koszyka.')
      setIsLoading(false)
      return
    }

    setCart(response?.data || response?.cart || null)
    window.dispatchEvent(new Event('cart:updated'))
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const items = useMemo(() => cart?.items || [], [cart])

  const updateQuantity = async (itemId, quantity) => {
    setPendingItemId(itemId)
    const response = await CartsService.updateCartItem({ itemId, quantity })
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || 'Nie udalo sie zaktualizowac pozycji.')
      setPendingItemId(null)
      return
    }

    setCart(response?.data || response?.cart || null)
    window.dispatchEvent(new Event('cart:updated'))
    setPendingItemId(null)
  }

  const removeItem = async (itemId) => {
    setPendingItemId(itemId)
    const response = await CartsService.removeCartItem({ itemId })
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || 'Nie udalo sie usunac pozycji.')
      setPendingItemId(null)
      return
    }

    setCart(response?.data || response?.cart || null)
    window.dispatchEvent(new Event('cart:updated'))
    setPendingItemId(null)
  }

  const clearAll = async () => {
    setPendingItemId('all')
    const response = await CartsService.clearCart()
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || 'Nie udalo sie wyczyscic koszyka.')
      setPendingItemId(null)
      return
    }

    setCart(response?.data || response?.cart || null)
    window.dispatchEvent(new Event('cart:updated'))
    setPendingItemId(null)
  }

  if (isLoading) {
    return <section className="cartModule">Ladowanie koszyka...</section>
  }

  return (
    <section className="cartModule">
      <div className="cartModuleHeader">
        <h1>Koszyk</h1>
        <button type="button" onClick={clearAll} disabled={pendingItemId === 'all' || items.length === 0}>
          Wyczysc koszyk
        </button>
      </div>

      {error ? <p className="cartError">{error}</p> : null}

      {items.length === 0 ? (
        <p className="cartEmpty">Koszyk jest pusty.</p>
      ) : (
        <div className="cartList">
          {items.map((item) => (
            <article key={item.id} className="cartItem">
              <div className="cartItemMain">
                <h3>{item.productNameSnapshot}</h3>
                <p>Cena: {formatPrice(item.unitGross)}</p>
              </div>

              <div className="cartItemActions">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, Math.max(1, Number(item.quantity) - 1))}
                  disabled={pendingItemId === item.id}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                  disabled={pendingItemId === item.id}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={pendingItemId === item.id}
                >
                  Usun
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="cartSummary">
        <p>Suma netto: {formatPrice(cart?.totalNet || 0)}</p>
        <p>Suma brutto: {formatPrice(cart?.totalGross || 0)}</p>
      </div>
    </section>
  )
}

export default Cart
