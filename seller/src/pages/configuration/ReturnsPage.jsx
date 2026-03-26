import { useEffect, useState } from 'react'
import Checkbox from 'components/FormikWrapper/FormControls/Checkbox'
import Input from 'components/FormikWrapper/FormControls/Input'
import Textarea from 'components/FormikWrapper/FormControls/Textarea'
import FormikWrapper from 'components/FormikWrapper'
import { useNotification } from 'components/GlobalNotification/useNotification'
import SellerSettingsService from 'services/sellerSettings'

const createInitialValues = (payload) => ({
  acceptsOnlineReturns: Boolean(payload?.returnPolicy?.acceptsOnlineReturns),
  returnWindowDays:
    payload?.returnPolicy?.returnWindowDays === null ||
    payload?.returnPolicy?.returnWindowDays === undefined
      ? ''
      : String(payload.returnPolicy.returnWindowDays),
  returnsAddressLine1: payload?.returnPolicy?.returnsAddressLine1 || '',
  returnsAddressLine2: payload?.returnPolicy?.returnsAddressLine2 || '',
  returnsCity: payload?.returnPolicy?.returnsCity || '',
  returnsPostalCode: payload?.returnPolicy?.returnsPostalCode || '',
  returnsCountryCode: payload?.returnPolicy?.returnsCountryCode || 'PL',
  returnsInstruction: payload?.returnPolicy?.returnsInstruction || '',
  returnShippingPaidBy: payload?.returnPolicy?.returnShippingPaidBy || 'client',
  hasSeparateComplaintProcess: Boolean(payload?.returnPolicy?.hasSeparateComplaintProcess),
  complaintInstruction: payload?.returnPolicy?.complaintInstruction || '',
})

const validateForm = (values) => {
  const errors = {}

  if (values.returnWindowDays !== '') {
    const normalizedDays = Number(values.returnWindowDays)
    if (!Number.isInteger(normalizedDays) || normalizedDays < 0 || normalizedDays > 365) {
      errors.returnWindowDays = 'Podaj liczbe calkowita od 0 do 365'
    }
  }

  if (values.acceptsOnlineReturns) {
    if (!String(values.returnsAddressLine1 || '').trim()) {
      errors.returnsAddressLine1 = 'Podaj adres zwrotow'
    }
    if (!String(values.returnsCity || '').trim()) {
      errors.returnsCity = 'Podaj miasto'
    }
    if (!String(values.returnsPostalCode || '').trim()) {
      errors.returnsPostalCode = 'Podaj kod pocztowy'
    }
    if (!String(values.returnsInstruction || '').trim()) {
      errors.returnsInstruction = 'Podaj instrukcje zwrotu'
    }
  }

  if (values.hasSeparateComplaintProcess && !String(values.complaintInstruction || '').trim()) {
    errors.complaintInstruction = 'Podaj opis procesu reklamacji'
  }

  return errors
}

const ReturnsPage = () => {
  const notification = useNotification()
  const [initialValues, setInitialValues] = useState(createInitialValues())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const response = await SellerSettingsService.getSellerSettings()

      if (response?.status && response.status >= 400) {
        notification.error(response?.data?.error || 'Nie udalo sie pobrac ustawien zwrotow')
        setIsLoading(false)
        return
      }

      setInitialValues(createInitialValues(response?.data || response))
      setIsLoading(false)
    }

    loadData()
  }, [notification])

  const handleSubmit = async (values, formikHelpers) => {
    const response = await SellerSettingsService.updateSellerSettings({
      returnPolicy: {
        acceptsOnlineReturns: Boolean(values.acceptsOnlineReturns),
        returnWindowDays: values.returnWindowDays === '' ? null : Number(values.returnWindowDays),
        returnsAddressLine1: values.returnsAddressLine1 || null,
        returnsAddressLine2: values.returnsAddressLine2 || null,
        returnsCity: values.returnsCity || null,
        returnsPostalCode: values.returnsPostalCode || null,
        returnsCountryCode: values.returnsCountryCode || 'PL',
        returnsInstruction: values.returnsInstruction || null,
        returnShippingPaidBy: values.returnShippingPaidBy || 'client',
        hasSeparateComplaintProcess: Boolean(values.hasSeparateComplaintProcess),
        complaintInstruction: values.complaintInstruction || null,
      },
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie zapisac ustawien zwrotow')
      formikHelpers.setSubmitting(false)
      return
    }

    const nextValues = createInitialValues(response?.data || response)
    setInitialValues(nextValues)
    formikHelpers.resetForm({ values: nextValues })
    formikHelpers.setSubmitting(false)
    notification.success('Ustawienia zwrotow zapisane')
  }

  if (isLoading) {
    return (
      <section className="sellerPageSection">
        <div className="sellerToolbar">
          <h2>Zwroty i reklamacje</h2>
        </div>
        <p>Ladowanie ustawien...</p>
      </section>
    )
  }

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Zwroty i reklamacje</h2>
      </div>

      <FormikWrapper initialValues={initialValues} onSubmit={handleSubmit} validate={validateForm}>
        {({ values, setFieldValue, isSubmitting }) => (
          <div className="sellerSettingsForm sellerForm">
            <section className="sellerFormSection">
              <h3>Polityka zwrotow</h3>
              <div className="sellerSettingsForm">
                <Checkbox
                  id="acceptsOnlineReturns"
                  placeholder="Sprzedawca przyjmuje zwroty online"
                />
                <div className="sellerFormGrid">
                  <Input
                    id="returnWindowDays"
                    placeholder="Okno czasowe na zwrot w dniach"
                    type="number"
                    min="0"
                    max="365"
                  />
                </div>
                <div className="sellerFormGrid">
                  <Input id="returnsAddressLine1" placeholder="Adres zwrotow - linia 1" />
                  <Input id="returnsAddressLine2" placeholder="Adres zwrotow - linia 2" />
                  <Input id="returnsCity" placeholder="Miasto" />
                  <Input id="returnsPostalCode" placeholder="Kod pocztowy" />
                  <Input id="returnsCountryCode" placeholder="Kod kraju" />
                </div>
                <Textarea id="returnsInstruction" placeholder="Instrukcja zwrotu dla klienta" />
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Koszt zwrotu</h3>
              <div className="sellerChoiceRow">
                <button
                  type="button"
                  className={`sellerChoiceButton${
                    values.returnShippingPaidBy === 'client' ? ' sellerChoiceButtonActive' : ''
                  }`}
                  onClick={() => setFieldValue('returnShippingPaidBy', 'client')}
                >
                  Pokrywa klient
                </button>
                <button
                  type="button"
                  className={`sellerChoiceButton${
                    values.returnShippingPaidBy === 'seller' ? ' sellerChoiceButtonActive' : ''
                  }`}
                  onClick={() => setFieldValue('returnShippingPaidBy', 'seller')}
                >
                  Pokrywa sprzedawca
                </button>
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Reklamacje</h3>
              <div className="sellerSettingsForm">
                <Checkbox
                  id="hasSeparateComplaintProcess"
                  placeholder="Osobny proces dla reklamacji"
                />
                <Textarea
                  id="complaintInstruction"
                  placeholder="Instrukcja procesu reklamacji"
                />
              </div>
            </section>

            <div className="sellerActions sellerFormActions">
              <button type="submit" className="sellerPrimaryButton" disabled={isSubmitting}>
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz ustawienia'}
              </button>
            </div>
          </div>
        )}
      </FormikWrapper>
    </section>
  )
}

export default ReturnsPage
