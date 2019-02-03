module.exports = ({ data }, { send, terminate, hostApi, responseTypes = [] }) => {
  let responseTypeHandler

  const operation = hostApi[data.operation]

  if(!operation) {
    throw new Error(`No operation '${data.operation}' on host API`)
  }

  Promise.resolve(operation.apply(null, patchParameters(data.parameters)))
    .then(value => {
      responseType = responseTypes.find(handler => handler.test(value))

      if(responseType) {
        responseTypeHandler = responseType.handler(value, { send, terminate })
      } else {
        // default response is return the result and terminate the session
        send.ok({ type: 'static', value })        
        terminate()
      }
    })
    .catch(error => {
      send.error(error)
      terminate()
    })

  return {
    messageHandler: message => { 
      if(responseTypeHandler) { 
        responseTypeHandler.messageHandler(message) 
      } 
    }
  }
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
