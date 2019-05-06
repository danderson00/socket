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

const normalizeError = error => {
  if(error && error.message) {
    return { message: error.message, stack: error.stack }
  } else if(typeof error === 'string') {
    return { message: error }
  } else {
    return { message: JSON.stringify(error) }
  }
}

const normalizeEvent = event => {
  if(typeof ErrorEvent !== 'undefined' && event instanceof ErrorEvent) {
    return normalizeError(event.error)
  } else if (event instanceof PromiseRejectionEvent) {
    return normalizeError(event.reason)
  }
  return normalizeError(event)
}