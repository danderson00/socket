const logUncaught = require('../../common/logUncaught')

const defaultOptions = { unhandled: true }

module.exports = options => ({ log }) => {
  options = { ...defaultOptions, ...options }

  if(options.unhandled) {
    logUncaught(error => log.child({ source: 'unhandled' }).error(error))
  }

  const apiLog = log.child({ source: 'api' })
  
  return {
    middleware: {
      log: (context, level, ...args) => {
        apiLog[level].apply(apiLog, args)
      }
    },
    api: {
      // this is becoming a bit of an anti-pattern...
      log: () => { }
    }
  }
}
