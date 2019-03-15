const { stdSerializers } = require('pino')
const logUncaught = require('../../common/logUncaught')

const defaultOptions = { unhandled: true }

module.exports = options => ({ log, api }) => {
  options = { ...defaultOptions, ...options }

  if(options.unhandled && api.log) {
    logUncaught(error => api.log('error', error))
  }

  return {
    middleware: {
      log: ({ next }, level, ...args) => {
        // log locally
        log[level].apply(log, args)
        return next.apply(null, [level, ...args.map(arg => arg instanceof Error ? stdSerializers.err(arg) : arg)])
      }
    }
  }
}