module.exports = (message, { send, terminate, hostApi }) => {
  const operation = hostApi[message.operation]

  if(!operation) {
    throw new Error(`No operation '${message.operation}' on host API`)
  }

  Promise.resolve(operation.apply(null, patchParameters(message.parameters)))
    .then(data => {
      // hook up specific response handlers here...

      // default response is return the result and terminate the session
      send({ status: 'ok', session: 'terminate', data })
      terminate()
    })
    .catch((error) => {
      send({ status: 'error', session: 'terminate', data: { message: error.message || error } })
      terminate()
    })

  return message => { /* no use for incoming messages here */ }
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
