import http from 'http'
import { program, Option } from "commander"
import 'dotenv/config'

import logger from './logger'
import getMeasurements from './measurements'
import { createMetrics, updateMetrics, getMetrics, getSingleMetric, contentType } from './metrics'
import { Opts } from './types'


    ; (async () => {
        program.name('stecagrid-exporter')
            .description('StecaGrid Prometheus exporter')
            .version("1.0.0")
            .addOption(new Option('-h, --host <hostname>', 'StecaGrid inverter address').env('INVERTER_HOST').makeOptionMandatory(true))
            .addOption(new Option('-p, --port <port>', 'Exporter listen port').env('METRICS_PORT').default('9488'))
            .addOption(new Option('-i, --interval', 'Polling interval in seconds').default('5'))
            .addOption(new Option('--prefix', 'Prefix to add to all metrics').env('METRIC_PREFIX').default('stecagrid_inverter_'))
            .parse()

        const { port, interval, host: stecaHost, prefix: metricPrefix } = program.opts<Opts>()

        try {
            const measurementsXml = await getMeasurements(stecaHost)

            createMetrics(metricPrefix, measurementsXml)
            updateMetrics(metricPrefix, measurementsXml)
        } catch (err) {
            logger.fatal(err, 'Failed to initialize exporter')
            return process.exit(1)
        }

        logger.info('Polling measurements with %d second interval', interval)
        setInterval(async () =>
            getMeasurements(stecaHost)
                .catch((err) => logger.error(err, 'Failed to fetch measurements'))
                .then((measurementsXml) => measurementsXml && updateMetrics(metricPrefix, measurementsXml))
                .catch((err) => logger.error(err, 'Failed to update metrics'))
            , parseInt(interval) * 1000)

        http.createServer((req, res) => {
            if (!req.url || !req.url.startsWith('/metrics')) {
                res.writeHead(404)
                return res.end()
            }
            if (req.url === '/metrics') {
                res.setHeader('Content-Type', contentType)
                res.writeHead(200)
                return getMetrics().then((metrics) => res.end(metrics))
            }
            const metric = req.url.match(/^\/metrics\/(?<metric>.+)$/)?.groups?.metric
            if (metric) {
                res.setHeader('Content-Type', contentType)
                res.writeHead(200)
                return getSingleMetric(metric).then((metric) => res.end(metric))
            }
        }).listen(port)

        logger.info('Server listening at http://localhost:%d', port)
    })()
