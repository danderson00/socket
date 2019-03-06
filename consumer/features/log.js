const { stdSerializers } = require('pino')

module.exports = options => ({ log }) => ({
  middleware: {
    log: ({ next }, level, ...args) => {
      // log locally
      log[level].apply(log, args)
      return next.apply(null, [level, ...args.map(arg => arg instanceof Error ? stdSerializers.err(arg) : arg)])
    }
  }
})