import DetailsList from 'components/DetailsList'
import FormikWrapper from 'components/FormikWrapper'
import Popup2 from 'components/Popup2'
import { useConfig } from 'providers/configProvider'
import { formatDateTime } from './OrderView.utils'

const resolveAllowedOptions = ({ currentValue, options, allowedValues, transitions }) => {
  const safeOptions = Array.isArray(options) ? options : []
  const safeAllowedValues = Array.isArray(allowedValues) ? allowedValues : []
  const nextTransitions = Array.isArray(transitions?.[currentValue]) ? transitions[currentValue] : []
  const allowedSet = new Set([currentValue, ...safeAllowedValues, ...nextTransitions].filter(Boolean))

  return safeOptions.filter((option) => allowedSet.has(option.value))
}

const OrderStatusPopup = ({ order, onClose, onSubmit }) => {
  const { config } = useConfig()
  const orderConfig = config?.orders || {}
  const initialValues = {
    status: order?.status || 'new',
    paymentStatus: order?.paymentStatus || 'pending',
  }
  const statusOptions = resolveAllowedOptions({
    currentValue: order?.status,
    options: orderConfig?.statuses,
    allowedValues: orderConfig?.permissions?.status,
    transitions: orderConfig?.statusTransitions,
  })
  const paymentStatusOptions = resolveAllowedOptions({
    currentValue: order?.paymentStatus,
    options: orderConfig?.paymentStatuses,
    allowedValues: orderConfig?.permissions?.paymentStatus,
    transitions: orderConfig?.paymentStatusTransitions,
  })

  return (
    <div className="orderStatusPopup">
      <h3 className="orderStatusPopupTitle">Zmiana statusow</h3>
      <FormikWrapper initialValues={initialValues} onSubmit={(values, helpers) => onSubmit(values, helpers, onClose)}>
        {({ values, setFieldValue, isSubmitting }) => (
          <div className="orderViewControls">
            <label htmlFor="sellerOrderStatus">Status zamowienia</label>
            <select id="sellerOrderStatus" value={values.status} onChange={(event) => setFieldValue('status', event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label htmlFor="sellerOrderPaymentStatus">Status platnosci</label>
            <select
              id="sellerOrderPaymentStatus"
              value={values.paymentStatus}
              onChange={(event) => setFieldValue('paymentStatus', event.target.value)}
            >
              {paymentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="orderStatusPopupActions">
              <button type="submit" className="orderViewPrimaryButton" disabled={isSubmitting}>
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button type="button" className="orderViewGhostButton" onClick={onClose} disabled={isSubmitting}>
                Anuluj
              </button>
            </div>
          </div>
        )}
      </FormikWrapper>
    </div>
  )
}

const OrderDetailsSection = ({ order, onStatusSubmit }) => {
  const { config } = useConfig()
  const orderConfig = config?.orders || {}
  const statusLabel =
    orderConfig?.statuses?.find((option) => option.value === order?.status)?.label || order?.status || '-'
  const paymentStatusLabel =
    orderConfig?.paymentStatuses?.find((option) => option.value === order?.paymentStatus)?.label ||
    order?.paymentStatus ||
    '-'
  const items = [
    { key: 'id', label: 'Numer zamowienia', value: order?.id ? `#${order.id}` : '-' },
    { key: 'groupId', label: 'ID grupy', value: order?.orderGroupId || '-' },
    { key: 'status', label: 'Status', value: statusLabel },
    { key: 'paymentStatus', label: 'Status platnosci', value: paymentStatusLabel },
    { key: 'createdAt', label: 'Data utworzenia', value: formatDateTime(order?.createdAt) },
  ]

  return (
    <DetailsList
      title="Dane zamowienia"
      action={
        <Popup2
          openButtonText="Zmien"
          buttonComponent="button"
          buttonProps={{ type: 'button', className: 'orderDetailsChangeButton' }}
          component={OrderStatusPopup}
          componentProps={{ order, onSubmit: onStatusSubmit }}
          modalProps={{ width: 420 }}
        />
      }
      items={items}
    />
  )
}

export default OrderDetailsSection
