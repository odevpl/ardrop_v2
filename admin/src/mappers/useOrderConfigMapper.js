import { useCallback, useMemo } from 'react'
import { mapConfigValue } from '../helpers/configMapper'
import { useConfig } from '../providers/configProvider'

export const useOrderConfigMapper = () => {
  const { config } = useConfig()

  const statusDict = config?.ORDER_STATUS_DICT
  const paymentMethodDict = config?.PAYMENT_METHODS_DICT
  const deliveryMethodDict = config?.DELIVERY_METHODS_DICT

  const mapOrderIdsToLabels = useCallback(
    (order) => ({
      ...order,
      status: mapConfigValue(statusDict, order.status),
      paymentMethod: mapConfigValue(paymentMethodDict, order.paymentMethod),
      deliveryMethod: mapConfigValue(deliveryMethodDict, order.deliveryMethod),
    }),
    [deliveryMethodDict, paymentMethodDict, statusDict],
  )

  return useMemo(
    () => ({
      mapOrderIdsToLabels,
    }),
    [mapOrderIdsToLabels],
  )
}
