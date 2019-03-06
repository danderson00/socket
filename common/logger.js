const pino = require('pino')

const defaultOptions = {
  level: 'warn',
  messageKey: 'message',
  base: { source: 'host' },
  prettyPrint: true
}

module.exports = (options = {}) => pino({ ...defaultOptions, ...options }, options.destination)
