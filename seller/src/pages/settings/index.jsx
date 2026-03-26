import { useEffect, useState } from 'react'
import Input from 'components/FormikWrapper/FormControls/Input'
import Textarea from 'components/FormikWrapper/FormControls/Textarea'
import Time from 'components/FormikWrapper/FormControls/Time'
import FormikWrapper from 'components/FormikWrapper'
import { useNotification } from 'components/GlobalNotification/useNotification'
import SellerSettingsService from 'services/sellerSettings'

const createInitialValues = (payload) => ({
  orderSupportEmail: payload?.settings?.orderSupportEmail || '',
  orderSupportPhone: payload?.settings?.orderSupportPhone || '',
  returnsEmail: payload?.settings?.returnsEmail || '',
  returnsPhone: payload?.settings?.returnsPhone || '',
  customerResponseTimeText: payload?.settings?.customerResponseTimeText || '',
  emailSignature: payload?.settings?.emailSignature || '',
  emailFooter: payload?.settings?.emailFooter || '',
  businessHours: {
    isOpen: Boolean(payload?.businessHours?.isOpen),
    openTime: payload?.businessHours?.openTime || null,
    closeTime: payload?.businessHours?.closeTime || null,
    note: payload?.businessHours?.note || '',
  },
})

const validateForm = (values) => {
  const errors = {}

  if (values.orderSupportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.orderSupportEmail)) {
    errors.orderSupportEmail = 'Niepoprawny adres e-mail'
  }

  if (values.returnsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.returnsEmail)) {
    errors.returnsEmail = 'Niepoprawny adres e-mail'
  }

  if (values.businessHours.openTime && !values.businessHours.closeTime) {
    errors.businessHours = { closeTime: 'Podaj godzine zamkniecia' }
  } else if (!values.businessHours.openTime && values.businessHours.closeTime) {
    errors.businessHours = { openTime: 'Podaj godzine otwarcia' }
  } else if (
    values.businessHours.openTime &&
    values.businessHours.closeTime &&
    values.businessHours.openTime >= values.businessHours.closeTime
  ) {
    errors.businessHours = { closeTime: 'Godzina zamkniecia musi byc pozniejsza' }
  }

  return errors
}

const SettingsPage = () => {
  const notification = useNotification()
  const [initialValues, setInitialValues] = useState(createInitialValues())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const response = await SellerSettingsService.getSellerSettings()

      if (response?.status && response.status >= 400) {
        notification.error(response?.data?.error || 'Nie udalo sie pobrac ustawien sprzedawcy')
        setIsLoading(false)
        return
      }

      setInitialValues(createInitialValues(response?.data || response))
      setIsLoading(false)
    }

    loadData()
  }, [notification])

  const handleSubmit = async (values, formikHelpers) => {
    const payload = {
      orderSupportEmail: values.orderSupportEmail || null,
      orderSupportPhone: values.orderSupportPhone || null,
      returnsEmail: values.returnsEmail || null,
      returnsPhone: values.returnsPhone || null,
      customerResponseTimeText: values.customerResponseTimeText || null,
      emailSignature: values.emailSignature || null,
      emailFooter: values.emailFooter || null,
      businessHours: {
        isOpen: Boolean(values.businessHours.openTime && values.businessHours.closeTime),
        openTime: values.businessHours.openTime || null,
        closeTime: values.businessHours.closeTime || null,
        note: values.businessHours.note || null,
      },
    }

    const response = await SellerSettingsService.updateSellerSettings(payload)

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie zapisac ustawien sprzedawcy')
      formikHelpers.setSubmitting(false)
      return
    }

    const nextValues = createInitialValues(response?.data || response)
    setInitialValues(nextValues)
    formikHelpers.resetForm({ values: nextValues })
    formikHelpers.setSubmitting(false)
    notification.success('Ustawienia sprzedawcy zapisane')
  }

  if (isLoading) {
    return (
      <section className="sellerPageSection">
        <div className="sellerToolbar">
          <h2>Ustawienia</h2>
        </div>
        <p>Ladowanie ustawien...</p>
      </section>
    )
  }

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Ustawienia operacyjne</h2>
      </div>

      <FormikWrapper initialValues={initialValues} onSubmit={handleSubmit} validate={validateForm}>
        {({ setFieldValue, isSubmitting }) => (
          <div className="sellerSettingsForm sellerForm">
            <section className="sellerFormSection">
              <h3>Dane kontaktowe do obslugi zamowien</h3>
              <div className="sellerFormGrid">
                <Input id="orderSupportEmail" placeholder="E-mail obslugi zamowien" />
                <Input id="orderSupportPhone" placeholder="Telefon obslugi zamowien" />
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Zwroty i reklamacje</h3>
              <div className="sellerFormGrid">
                <Input id="returnsEmail" placeholder="E-mail do zwrotow i reklamacji" />
                <Input id="returnsPhone" placeholder="Telefon do zwrotow i reklamacji" />
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Godziny pracy obslugi klienta</h3>
              <div className="sellerSettingsHoursRow">
                <div className="sellerSettingsHoursHeader">
                  <strong>Poniedzialek - Piatek</strong>
                </div>

                <div className="sellerSettingsHoursFields">
                  <Time id="businessHours.openTime" placeholder="Otwarcie" />
                  <Time id="businessHours.closeTime" placeholder="Zamkniecie" />
                  <Input id="businessHours.note" placeholder="Notatka" />
                </div>

                <button
                  type="button"
                  className="sellerSettingsClearButton"
                  onClick={() => {
                    setFieldValue('businessHours.openTime', null)
                    setFieldValue('businessHours.closeTime', null)
                    setFieldValue('businessHours.note', '')
                  }}
                >
                  Wyczyść godziny
                </button>
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Komunikacja z klientem</h3>
              <div className="sellerFormGrid">
                <Input
                  id="customerResponseTimeText"
                  placeholder="Publiczna informacja o czasie odpowiedzi"
                />
              </div>
              <div className="sellerSettingsTextareaGroup">
                <Textarea id="emailSignature" placeholder="Domyslny podpis wiadomosci" />
                <Textarea id="emailFooter" placeholder="Domyslna stopka wiadomosci" />
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

export default SettingsPage
