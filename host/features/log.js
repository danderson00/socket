module.exports = options => ({ log }) => {
  log = log.child({ source: 'api' })
  
  return {
    middleware: {
      log: (context, level, ...args) => log[level].apply(log, args)
    },
    api: {
      // this is becoming a bit of an anti-pattern...
      log: () => {}
    }
  }
}
