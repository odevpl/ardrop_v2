import { useEffect, useState } from 'react'
import Checkbox from 'components/FormikWrapper/FormControls/Checkbox'
import Date from 'components/FormikWrapper/FormControls/Date'
import Input from 'components/FormikWrapper/FormControls/Input'
import Textarea from 'components/FormikWrapper/FormControls/Textarea'
import Time from 'components/FormikWrapper/FormControls/Time'
import FormikWrapper from 'components/FormikWrapper'
import { useNotification } from 'components/GlobalNotification/useNotification'
import SellerSettingsService from 'services/sellerSettings'

const SHIPPING_DAY_OPTIONS = [
  { value: 1, label: 'Pon' },
  { value: 2, label: 'Wt' },
  { value: 3, label: 'Sr' },
  { value: 4, label: 'Czw' },
  { value: 5, label: 'Pt' },
  { value: 6, label: 'Sob' },
  { value: 7, label: 'Nd' },
]

const createInitialValues = (payload) => ({
  defaultOrderPreparationDays:
    payload?.settings?.defaultOrderPreparationDays === null ||
    payload?.settings?.defaultOrderPreparationDays === undefined
      ? ''
      : String(payload.settings.defaultOrderPreparationDays),
  shippingWorkdays: Array.isArray(payload?.fulfillment?.shippingWorkdays)
    ? payload.fulfillment.shippingWorkdays
    : [],
  sameDayShippingCutoffTime: payload?.fulfillment?.sameDayShippingCutoffTime || null,
  vacationModeEnabled: Boolean(payload?.fulfillment?.vacationModeEnabled),
  vacationModeMessage: payload?.fulfillment?.vacationModeMessage || '',
  holidays: Array.isArray(payload?.holidays)
    ? payload.holidays.map((holiday) => ({
        holidayDate: holiday.holidayDate || null,
        name: holiday.name || '',
      }))
    : [],
})

const validateForm = (values) => {
  const errors = {}

  if (values.defaultOrderPreparationDays !== '') {
    const normalizedDays = Number(values.defaultOrderPreparationDays)
    if (!Number.isInteger(normalizedDays) || normalizedDays < 0 || normalizedDays > 365) {
      errors.defaultOrderPreparationDays = 'Podaj liczbe calkowita od 0 do 365'
    }
  }

  if (
    values.sameDayShippingCutoffTime &&
    (!Array.isArray(values.shippingWorkdays) || values.shippingWorkdays.length === 0)
  ) {
    errors.shippingWorkdays = 'Wybierz dni robocze wysylek'
  }

  if (values.vacationModeEnabled && !String(values.vacationModeMessage || '').trim()) {
    errors.vacationModeMessage = 'Podaj komunikat dla klienta'
  }

  const holidayErrors = values.holidays.map((holiday) => {
    const rowErrors = {}
    if (!holiday.holidayDate) {
      rowErrors.holidayDate = 'Podaj date'
    }
    return rowErrors
  })

  if (holidayErrors.some((row) => Object.keys(row).length > 0)) {
    errors.holidays = holidayErrors
  }

  return errors
}

const FulfillmentPage = () => {
  const notification = useNotification()
  const [initialValues, setInitialValues] = useState(createInitialValues())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const response = await SellerSettingsService.getSellerSettings()

      if (response?.status && response.status >= 400) {
        notification.error(response?.data?.error || 'Nie udalo sie pobrac ustawien realizacji')
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
      defaultOrderPreparationDays:
        values.defaultOrderPreparationDays === ''
          ? null
          : Number(values.defaultOrderPreparationDays),
      shippingWorkdays: values.shippingWorkdays,
      sameDayShippingCutoffTime: values.sameDayShippingCutoffTime || null,
      vacationModeEnabled: Boolean(values.vacationModeEnabled),
      vacationModeMessage: values.vacationModeMessage || null,
      holidays: values.holidays
        .filter((holiday) => holiday.holidayDate)
        .map((holiday) => ({
          holidayDate: holiday.holidayDate,
          name: holiday.name || null,
        })),
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie zapisac ustawien realizacji')
      formikHelpers.setSubmitting(false)
      return
    }

    const nextValues = createInitialValues(response?.data || response)
    setInitialValues(nextValues)
    formikHelpers.resetForm({ values: nextValues })
    formikHelpers.setSubmitting(false)
    notification.success('Ustawienia realizacji zapisane')
  }

  if (isLoading) {
    return (
      <section className="sellerPageSection">
        <div className="sellerToolbar">
          <h2>Realizacja zamowien</h2>
        </div>
        <p>Ladowanie ustawien...</p>
      </section>
    )
  }

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Realizacja zamowien</h2>
      </div>

      <FormikWrapper initialValues={initialValues} onSubmit={handleSubmit} validate={validateForm}>
        {({ values, errors, setFieldValue, isSubmitting }) => (
          <div className="sellerSettingsForm sellerForm">
            <section className="sellerFormSection">
              <h3>Domyslny czas przygotowania</h3>
              <p className="sellerConfigPlaceholderText">
                Okresla domyslna liczbe dni potrzebnych na przygotowanie zamowienia do wysylki.
              </p>
              <div className="sellerFormGrid">
                <Input
                  id="defaultOrderPreparationDays"
                  placeholder="Liczba dni przygotowania"
                  type="number"
                  min="0"
                  max="365"
                />
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Dni robocze wysylek</h3>
              <div className="sellerCheckboxRow">
                {SHIPPING_DAY_OPTIONS.map((day) => (
                  <Checkbox
                    key={day.value}
                    id={`shippingWorkdaysFlags.${day.value}`}
                    placeholder={day.label}
                    checked={values.shippingWorkdays.includes(day.value)}
                    onChange={() => {
                      const exists = values.shippingWorkdays.includes(day.value)
                      const nextValue = exists
                        ? values.shippingWorkdays.filter((item) => item !== day.value)
                        : [...values.shippingWorkdays, day.value].sort((a, b) => a - b)
                      setFieldValue('shippingWorkdays', nextValue)
                    }}
                  />
                ))}
              </div>
              {errors.shippingWorkdays ? (
                <p className="sellerFormError">{errors.shippingWorkdays}</p>
              ) : null}
              <div className="sellerConfigPlaceholderText">
                Zaznaczone dni oznaczaja standardowe dni nadawania przesylek.
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Wysylka tego samego dnia</h3>
              <div className="sellerFormGrid">
                <Time
                  id="sameDayShippingCutoffTime"
                  placeholder="Godzina graniczna dla wysylki tego samego dnia"
                />
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Dni wylaczone z realizacji</h3>
              <div className="sellerSettingsForm">
                {values.holidays.map((holiday, index) => (
                  <div key={`holiday-${index}`} className="sellerSettingsHoursRow">
                    <div className="sellerSettingsHoursFields">
                      <Date id={`holidays.${index}.holidayDate`} placeholder="Data" />
                      <Input id={`holidays.${index}.name`} placeholder="Powod / notatka" />
                    </div>
                    <button
                      type="button"
                      className="sellerSettingsClearButton"
                      onClick={() => {
                        const nextHolidays = values.holidays.filter((_, itemIndex) => itemIndex !== index)
                        setFieldValue('holidays', nextHolidays)
                      }}
                    >
                      Usun dzien
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFieldValue('holidays', [
                      ...values.holidays,
                      { holidayDate: null, name: '' },
                    ])
                  }
                >
                  Dodaj dzien wylaczony
                </button>
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Tryb urlopowy</h3>
              <div className="sellerSettingsForm">
                <Checkbox id="vacationModeEnabled" placeholder="Wlacz tryb urlopowy" />
                <Textarea
                  id="vacationModeMessage"
                  placeholder="Komunikat dla klienta podczas trybu urlopowego"
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

export default FulfillmentPage
