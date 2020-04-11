const defaultOptions = {
  timeout: 100,
  triggerCount: 4
}

module.exports = (target, options) => {
  if(options === false) {
    return target
  }

  options = { ...defaultOptions, ...options }

  let currentThrottle
  let lastArgs
  let enqueueCount = 0

  const maybeExecuteAfterTimeout = () => makeAsync(
    () => lastArgs && target.apply(null, lastArgs), options.timeout
  )().finally(() => {
    if(enqueueCount > 0) {
      currentThrottle = maybeExecuteAfterTimeout()
    }
    lastArgs = null
    enqueueCount = 0
  })

  return (...args) => {
    enqueueCount++
    if(!currentThrottle && enqueueCount < options.triggerCount) {
      // to be consistent, return an async version of the function
      return makeAsync(target).apply(null, args)
    } else {
      lastArgs = args
      return currentThrottle = currentThrottle || maybeExecuteAfterTimeout()
    }
  }
}

const makeAsync = (target, delay) => (...args) => new Promise((resolve, reject) => {
  if(delay !== undefined) {
    setTimeout(execute, delay)
  } else {
    execute()
  }

  function execute() {
    try {
      Promise.resolve(target.apply(null, args)).then(resolve).catch(reject)
    } catch (error) {
      reject(error)
    }
  }
})




/*

const old = (target, options) => {
  options = { ...defaultOptions, ...options }

  let currentPromise, lastArgs

  return (...args) => {
    if(!currentPromise) {
      // no timeout has been set, kick off the timer and a leading execution
      currentPromise = new Promise((resolve, reject) => setTimeout(() => {
        if(lastArgs) {
          try {
            Promise.resolve(target.apply(null, lastArgs))
              .then(resolve)
              .catch(reject)
              .finally(() => lastArgs = null)
          } catch(e) {
            reject(e)
          }
        }
      }, options.timeout))

      try {
        return Promise.resolve(target.apply(null, args))
      } catch(e) {
        return Promise.reject(e)
      }
    } else {
      // otherwise a timer has already been started - log the arguments as being the last
      lastArgs = args
      return currentPromise
    }
  }
}
 */