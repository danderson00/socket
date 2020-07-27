const defaultOptions = {
  timeout: 100
}

module.exports = (target, userOptions) => {
  if(userOptions === false) {
    return target
  }

  const options = { ...defaultOptions, ...userOptions }

  let currentThrottle, lastArgs

  const asyncTarget = (...args) => {
    try {
      return Promise.resolve(target(...args))
    } catch(error) {
      return Promise.reject(error)
    }
  }

  const maybeExecuteAfterTimeout = () => (
    currentThrottle = new Promise((resolve, reject) => setTimeout(() => {
      if(lastArgs) {
        // maybeExecuteAfterTimeout() // wait until completion to trigger next timeout or not?
        asyncTarget(...lastArgs)
          .then(resolve)
          .catch(reject)
          .finally(maybeExecuteAfterTimeout)
        lastArgs = undefined
      } else {
        currentThrottle = undefined
      }
    }, options.timeout))
  )

  return (...args) => {
    if (currentThrottle) {
      lastArgs = args
      return currentThrottle
    } else {
      maybeExecuteAfterTimeout()
      return asyncTarget(...args)
    }
  }
}
