import { get } from "http"
import { parseStringPromise } from "xml2js"

import logger from './logger'
import { MeasurementsXML } from './types'

const fetchMeasurementsXml = (url: string) => new Promise<string>((res, rej) => {
    logger.debug('Fetching measurements from %s', url)
    get(url, (response) => {
        const { statusCode } = response
        const contentType = response.headers['content-type']

        if (statusCode !== 200) {
            return rej(new Error(`Request Failed with status Code: ${statusCode}`))
        }
        if (!contentType || !/^application\/xml/.test(contentType)) {
            return rej(new Error(`Invalid content-type. Expected application/xml but received ${contentType}`))
        }

        let rawData = ''
        response.on('data', (chunk) => rawData += chunk)
        response.on('end', () => res(rawData))
    }).on('error', (err) => rej(err))
})

const parseMeasurementsXml = (xmlString: string) =>
    parseStringPromise(xmlString) as Promise<MeasurementsXML>

const getMeasurements = (host: string) =>
    fetchMeasurementsXml(`${host}/measurements.xml`)
        .then(parseMeasurementsXml)

export default getMeasurements
