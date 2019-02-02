module.exports = (socket, hostApi, log, options) => async data => {
  const message = parseMessage(data)

  const respond = (status, result) => {
    socket.send(JSON.stringify({ 
      id: message.id, 
      operation: message.operation, 
      status, 
      data: result
    }))
  }

  let timedOut = false
  const timeout = options.timeout &&
    setTimeout(() => {
      timedOut = true
      reportError(new Error(
        `${message.operation} operation timed out after ${options.timeout}ms`
      ))
    }, options.timeout)

  try {
    const result = await Promise.resolve(
      hostApi[message.operation].apply(hostApi, patchArguments(message.arguments))
    )
    respond(timedOut ? 'timeout' : 'ok', result)
  } catch(error) {
    reportError(error)
  } finally {
    clearTimeout(timeout)
  }

  function reportError(error) {
    log.error(`Error occurred in ${message.operation} operation`, error)
    respond('error', error && { message: error.message || error, stack: error.stack })
  }
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchArguments = (args = []) => args.map(x => x === null ? undefined : x)

const parseMessage = data => {
  try {
    return JSON.parse(data)
  } catch(error) {
    throw new Error(`Socket data was not JSON: ${data}`)
  }
}