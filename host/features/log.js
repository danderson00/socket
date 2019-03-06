module.exports = options => ({ log }) => ({
  middleware: {
    log: (context, level, args) => log.child({ source: 'api' })[level].apply(log, args)
  },
  api: {
    // this is becoming a bit of an anti-pattern...
    log: () => {}
  }
})
