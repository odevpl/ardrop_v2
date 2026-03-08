import FetchWrapper from 'components/FetchWrapper'
import FormikWrapper from 'components/FormikWrapper'
import Checkbox from 'components/FormikWrapper/FormControls/Checkbox'
import Input from 'components/FormikWrapper/FormControls/Input'
import { useNavigate } from 'react-router-dom'
import { getSellerById, updateSeller } from 'services/sellers'

const SellerViewForm = ({ payload, refetch, sellerId }) => {
  const navigate = useNavigate()
  const seller = payload?.data || payload?.seller || {}
  const initialValues = {
    email: seller.email || '',
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
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          setStatus(null)
          const payloadToUpdate = {
            ...values,
            email: values.email?.trim(),
            companyName: values.companyName?.trim(),
            phone: values.phone?.trim() || null,
            nip: values.nip?.trim() || null,
            address: values.address?.trim() || null,
            city: values.city?.trim() || null,
            postalCode: values.postalCode?.trim() || null,
          }

          const result = await updateSeller(sellerId, payloadToUpdate)
          if (result?.status && result.status >= 400) {
            setStatus(result?.data?.error || 'Nie udalo sie zapisac sprzedawcy')
            setSubmitting(false)
            return
          }

          setStatus('Dane sprzedawcy zostaly zapisane')
          setSubmitting(false)
          await refetch()
        }}
      >
        {({ isSubmitting, status }) => (
          <>
            <div className="adminFormGrid">
              <Input id="email" placeholder="Email" />
              <Input id="companyName" placeholder="Firma" />
              <Input id="phone" placeholder="Telefon" />
              <Input id="nip" placeholder="NIP" />
              <Input id="city" placeholder="Miasto" />
              <Input id="address" placeholder="Adres" />
              <Input id="postalCode" placeholder="Kod pocztowy" />
            </div>
            <Checkbox id="isActive" placeholder="Aktywny" />

            {status ? <p className="adminFormError">{status}</p> : null}

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
