const logUncaught = require('../../common/logUncaught')

const defaultOptions = { unhandled: true }

module.exports = options => ({ log }) => {
  options = { ...defaultOptions, ...options }

  log = log.child({ source: 'api' })
  
  if(options.unhandled) {
    logUncaught(error => log.error(error))
  }

  return {
    middleware: {
      log: (context, level, ...args) => {
        log[level].apply(log, args)
      }
    },
    api: {
      // this is becoming a bit of an anti-pattern...
      log: () => { }
    }
  }
}
