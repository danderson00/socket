module.exports = logError => {
  const logNormalized = error => logError(normalizeEvent(error))

  if(typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('unhandledrejection', logNormalized)
    window.addEventListener('error', logNormalized)
  } else if(typeof process !== 'undefined' && process.on) {
    process.on('uncaughtException', logNormalized)
    process.on('unhandledRejection', logNormalized)
  }
}

const normalizeEvent = event => {
  if(typeof ErrorEvent !== 'undefined' && event instanceof ErrorEvent) {
    return event.error
  } else if (typeof PromiseRejectionEvent !== 'undefined' && event instanceof PromiseRejectionEvent) {
    return event.reason
  }
  return event
}