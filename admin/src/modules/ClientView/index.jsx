import FetchWrapper from 'components/FetchWrapper'
import FormikWrapper from 'components/FormikWrapper'
import Checkbox from 'components/FormikWrapper/FormControls/Checkbox'
import Input from 'components/FormikWrapper/FormControls/Input'
import { useNotification } from 'components/GlobalNotification/index.js'
import { useNavigate } from 'react-router-dom'
import { deleteClient, getClientById, updateClient } from 'services/clients'

const ClientViewForm = ({ payload, refetch, clientId }) => {
  const navigate = useNavigate()
  const notification = useNotification()
  const client = payload?.data || payload?.client || {}
  const initialValues = {
    email: client.email || '',
    name: client.name || '',
    phone: client.phone || '',
    companyName: client.companyName || '',
    nip: client.nip || '',
    address: client.address || '',
    city: client.city || '',
    postalCode: client.postalCode || '',
    isActive: Boolean(client.isActive),
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Usunac klienta #${clientId} wraz z kontem uzytkownika? Operacja jest nieodwracalna.`,
    )
    if (!confirmed) {
      return
    }

    const result = await deleteClient(clientId)
    if (result?.status && result.status >= 400) {
      notification.error(result?.data?.error || 'Nie udalo sie usunac klienta')
      return
    }

    notification.success('Klient zostal usuniety')
    navigate('/clients')
  }

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Edycja klienta #{clientId}</h2>
      </div>

      <FormikWrapper
        className="adminProductForm"
        initialValues={initialValues}
        onSubmit={async (values, { setSubmitting }) => {
          const payloadToUpdate = {
            ...values,
            email: values.email?.trim(),
            name: values.name?.trim(),
            phone: values.phone?.trim() || null,
            companyName: values.companyName?.trim() || null,
            nip: values.nip?.trim() || null,
            address: values.address?.trim() || null,
            city: values.city?.trim() || null,
            postalCode: values.postalCode?.trim() || null,
          }

          const result = await updateClient(clientId, payloadToUpdate)
          if (result?.status && result.status >= 400) {
            notification.error(result?.data?.error || 'Nie udalo sie zapisac klienta')
            setSubmitting(false)
            return
          }

          notification.success('Dane klienta zostaly zapisane')
          setSubmitting(false)
          await refetch()
        }}
      >
        {({ isSubmitting }) => (
          <>
            <div className="adminFormGrid">
              <Input id="email" placeholder="Email" />
              <Input id="name" placeholder="Nazwa" />
              <Input id="phone" placeholder="Telefon" />
              <Input id="companyName" placeholder="Firma" />
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
              <button type="button" className="adminDangerButton" onClick={handleDelete} disabled={isSubmitting}>
                Usun klienta
              </button>
              <button type="button" onClick={() => navigate('/clients')} disabled={isSubmitting}>
                Wroc do listy
              </button>
            </div>
          </>
        )}
      </FormikWrapper>
    </section>
  )
}

const ClientView = ({ id }) => {
  return (
    <FetchWrapper
      component={(props) => <ClientViewForm {...props} clientId={id} />}
      id={id}
      name="Klient"
      connector={() => getClientById(id)}
    />
  )
}

export default ClientView

