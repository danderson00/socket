module.exports = (socket, hostApi, log) => data => {
  const message = parseMessage(data)

  const respond = (status, result) => {
    socket.send(JSON.stringify({ 
      id: message.id, 
      operation: message.operation, 
      status, 
      data: result
    }))
  }

  try {
    return Promise.resolve(hostApi[message.operation].apply(hostApi, patchArguments(message.arguments)))
      .then(result => respond('ok', result))
      .catch(reportError)
  } catch(error) {
    reportError(error)
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