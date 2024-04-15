const logUncaught = require('../../common/logUncaught')

const defaultOptions = { unhandled: true }

module.exports = userOptions => ({ log }) => {
  const options = { ...defaultOptions, ...userOptions }

  if(options.unhandled) {
    logUncaught(error => log.child({ source: 'unhandled' }).error(error))
  }

  return {
    name: 'log',
    middleware: {
      log: (context, level, ...args) => {
        context.log[level]({ origin: 'consumer' }, ...args)
      }
    },
    api: {
      log: () => { }
    }
  }
}
