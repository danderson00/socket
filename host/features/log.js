module.exports = options => ({
  middleware: {
    log: ({ log }, level, args) => log.child({ source: 'api' })[level].apply(log, args)
  },
  api: {
    // this is becoming a bit of an anti-pattern...
    log: () => {}
  }
})
