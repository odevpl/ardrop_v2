import FetchWrapper from 'components/FetchWrapper'
import FormikWrapper from 'components/FormikWrapper'
import Checkbox from 'components/FormikWrapper/FormControls/Checkbox'
import Input from 'components/FormikWrapper/FormControls/Input'
import { useNotification } from 'components/GlobalNotification/index.js'
import { useNavigate } from 'react-router-dom'
import { getSellerById, updateSeller } from 'services/sellers'

const SellerViewForm = ({ payload, refetch, sellerId }) => {
  const navigate = useNavigate()
  const notification = useNotification()
  const seller = payload?.data || payload?.seller || {}
  const initialValues = {
    email: seller.email || '',
    password: '',
    companyName: seller.companyName || '',
    phone: seller.phone || '',
    nip: seller.nip || '',
    address: seller.address || '',
    city: seller.city || '',
    postalCode: seller.postalCode || '',
    isActive: Boolean(seller.isActive),
  }

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Edycja sprzedawcy #{sellerId}</h2>
      </div>

      <FormikWrapper
        className="adminProductForm"
        initialValues={initialValues}
        onSubmit={async (values, { setSubmitting }) => {
          const payloadToUpdate = {
            ...values,
            email: values.email?.trim(),
            password: values.password || undefined,
            companyName: values.companyName?.trim(),
            phone: values.phone?.trim() || null,
            nip: values.nip?.trim() || null,
            address: values.address?.trim() || null,
            city: values.city?.trim() || null,
            postalCode: values.postalCode?.trim() || null,
          }

          const result = await updateSeller(sellerId, payloadToUpdate)
          if (result?.status && result.status >= 400) {
            notification.error(result?.data?.error || 'Nie udalo sie zapisac sprzedawcy')
            setSubmitting(false)
            return
          }

          notification.success('Dane sprzedawcy zostaly zapisane')
          setSubmitting(false)
          await refetch()
        }}
      >
        {({ isSubmitting }) => (
          <>
            <div className="adminFormGrid">
              <Input id="email" placeholder="Email" />
              <Input id="password" placeholder="Nowe haslo (opcjonalnie)" type="password" autoComplete="new-password" />
              <Input id="companyName" placeholder="Firma" />
              <Input id="phone" placeholder="Telefon" />
              <Input id="nip" placeholder="NIP" />
              <Input id="city" placeholder="Miasto" />
              <Input id="address" placeholder="Adres" />
              <Input id="postalCode" placeholder="Kod pocztowy" />
            </div>
            <Checkbox id="isActive" placeholder="Aktywny" />

            <div className="adminActions adminFormActions">
              <button type="submit" className="adminPrimaryButton" disabled={isSubmitting}>
                Zapisz
              </button>
              <button type="button" onClick={() => navigate('/sellers')} disabled={isSubmitting}>
                Wroc do listy
              </button>
            </div>
          </>
        )}
      </FormikWrapper>
    </section>
  )
}

const SellerView = ({ id }) => {
  return (
    <FetchWrapper
      component={(props) => <SellerViewForm {...props} sellerId={id} />}
      id={id}
      name="Sprzedawca"
      connector={() => getSellerById(id)}
    />
  )
}

export default SellerView

