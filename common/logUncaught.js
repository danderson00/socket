module.exports = logError => {
  const logNormalized = error => logError(normalizeError(error))

  if(typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('unhandledrejection', logNormalized)
    window.addEventListener('error', logNormalized)
  } else if(typeof process !== 'undefined' && process.on) {
    process.on('uncaughtException', logNormalized)
    process.on('unhandledRejection', logNormalized)
  }
}

const normalizeError = error => {
  if(typeof ErrorEvent !== 'undefined' && error instanceof ErrorEvent) {
    return {
      message: error.error.message,
      stack: error.error.stack
    }
  } else if (error instanceof Error || (error && error.message)) {
    return {
      message: error.message,
      stack: error.stack
    }
  } else {
    return {
      message: (error + '') || 'Unknown error'
    }
  }
}