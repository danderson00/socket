// just use console by default, remapping trace to debug
module.exports = (level = 1) => ({
  error: function () { if(level >= levels.error || levels[level] >= levels.error) console.error.apply(console, arguments) },
  warn: function () { if(level >= levels.warn || levels[level] >= levels.warn) console.warn.apply(console, arguments) },
  info: function () { if(level >= levels.info || levels[level] >= levels.info) console.info.apply(console, arguments) },
  verbose: function () { if(level >= levels.verbose || levels[level] >= levels.verbose) console.log.apply(console, arguments) },
  log: function () { if(level >= levels.verbose || levels[level] >= levels.verbose) console.log.apply(console, arguments) },
  debug: function () { if(level >= levels.debug || levels[level] >= levels.debug) console.debug.apply(console, arguments) },
  silly: function () { if(level >= levels.trace || levels[level] >= levels.silly) console.debug.apply(console, arguments) },
  trace: function () { if(level >= levels.trace || levels[level] >= levels.trace) console.debug.apply(console, arguments) },
  setLevel: function (to) { level = to }
})

const levels = { 
  error: 0, 
  warn: 1, 
  info: 2, 
  verbose: 3, 
  debug: 4, 
  trace: 5 
};