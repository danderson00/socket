module.exports = (observable, { send, hostApi, responseTypes = [] }) => {
  const { data } = observable()
  const operation = hostApi[data.operation]

  if(!operation) {
    throw new Error(`No operation '${data.operation}' on host API`)
  }

  return Promise.resolve(operation.apply(null, patchParameters(data.parameters)))
    .then(value => {
      const responseType = responseTypes.find(handler => handler.test(value))

      if(responseType) {
        responseTypeHandler = responseType.handler(observable, send)
      } else {
        // default response is return the result and terminate the session
        send.ok({ type: 'static', value })   
        observable.disconnect()     
      }
    })
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
