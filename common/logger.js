const pino = require('pino')

const defaultOptions = {
  level: 'warn',
  messageKey: 'message',
  base: { source: 'host' },
  browser: {
    write: { trace: o => console.debug(o) }
  }
}

module.exports = (options = {}) => pino({ ...defaultOptions, ...options }, options.destination)
