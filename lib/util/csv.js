import _ from 'highland'
import moment from 'moment'
import Baby from 'babyparse'

/**
 * Reads a CSV file and produces a Highland stream from it.
 * @private
 * @param  {Object} options
 * @return {Stream} A Highland stream.
 */
export default function csv(options) {
  return _((push, next) => {
    Baby.parseFiles(options.filename, Object.assign({
      step: (results) => {
        const parsed = parseRow(results)
        if (parsed) {
          parsed.identifier = options.identifier
          push(null, parsed)
        }
      },
      complete: () => push(null, _.nil),
      error: (e) => push(e, null)
    }, options.babyparse))
  })
}

/**
 * Converts each row to a nicely formatted object.
 *
 * @private
 * @param {Array} row A BabyParse CSV row.
 * @return {Object} The parsed row, with CSV columns now being object
 * properties.
 */
function parseRow(row) {
  let parsed = null
  if (row.data[0] && row.data[0][0] !== '') {
    const data = row.data[0]
    parsed = {
      timestamp: parseInt(moment(data[0], 'D-MMM-YY').format('x'), 10),
      open: parseFloat(data[1]),
      high: parseFloat(data[2]),
      low: parseFloat(data[3]),
      close: parseFloat(data[4]),
      volume: parseFloat(data[5])
    }
    if (
      !parsed.timestamp &&
      !parsed.open &&
      !parsed.high &&
      !parsed.low &&
      !parsed.close
    ) {
      return null
    }
  }
  return parsed
}
