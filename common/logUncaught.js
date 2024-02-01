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
  if(error instanceof Error) {
    return error
  } else if(typeof error === 'string') {
    return { message: error }
  } else {
    return error && { message: JSON.stringify(error) }
  }
}

const normalizeEvent = event => {
  if(typeof ErrorEvent !== 'undefined' && event instanceof ErrorEvent) {
    return normalizeError(event.error)
  } else if (typeof PromiseRejectionEvent !== 'undefined' && event instanceof PromiseRejectionEvent) {
    return normalizeError(event.reason)
  }
  return normalizeError(event)
}