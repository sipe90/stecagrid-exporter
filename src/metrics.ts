import pino from 'pino'
import { Gauge, register, collectDefaultMetrics } from 'prom-client'

import { MeasurementsXML } from './types'
import logger from './logger'

const getMeasurements = (measurementsXml: MeasurementsXML) =>
    measurementsXml.root.Device[0].Measurements[0].Measurement

export const createMetrics = (metricPrefix: string, measurementsXml: MeasurementsXML) => {
    logger.info('Registering metrics')
    collectDefaultMetrics({ prefix: metricPrefix })
    register.setDefaultLabels({ ...measurementsXml.root.Device[0].$ })
    getMeasurements(measurementsXml).forEach((m) => {
        const name = metricPrefix + m.$.Type
        const help = m.$.Type
        const value = m.$.Value
        if (!value) {
            logger.info('Not registering metric %s since it doesn\'t provide a value', name)
            return
        }
        logger.debug('Registering gauge metric %s', name)
        register.registerMetric(
            new Gauge({ name, help })
        )
    })
}

export const updateMetrics = (metricPrefix: string, measurementsXml: MeasurementsXML) => {
    logger.debug('Updating metrics')
    getMeasurements(measurementsXml).forEach((m) => {
        const metricName = metricPrefix + m.$.Type
        const value = m.$.Value
        if (!value) {
            return
        }

        const metric = register.getSingleMetric(metricName) as Gauge | undefined
        if (!metric) {
            logger.error('No registered metric found with name %s', metricName)
            return
        }

        logger.trace('Updating metric %s value to %d', metricName, value)
        metric.set(parseFloat(m.$.Value!))
    })
}

export const contentType = register.contentType

export const getMetrics = () => register.metrics()

export const getSingleMetric = (metric: string) => register.getSingleMetricAsString(metric)
