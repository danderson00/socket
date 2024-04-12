const logUncaught = require('../../common/logUncaught')

const defaultOptions = { unhandled: true }

module.exports = options => ({ log }) => {
  const { unhandled } = { ...defaultOptions, ...options }

  return {
    name: 'log',
    initialise: ({ api }) => {
      if(unhandled && api.log) {
        logUncaught(error => api.log('error', error))
      }

      return {
        middleware: {
          // it would be nicer to have a recursive host API structure to allow log.debug(), etc.
          // this places too much responsibility on the consumer to create the API
          // it's actually a bit arse about face having the API function call the log function
          // - it should be the other way around - a log writer calling the API function
          log: ({ next }, level, ...args) => {
            const entry = log[level].apply(log, args)
            if(entry.origin !== 'host')
              return next.apply(null, [level, entry])
          }
        }
      }
    }
  }
}