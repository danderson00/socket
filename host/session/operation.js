module.exports = ({ data }, { send, terminate, hostApi }) => {
  const operation = hostApi[data.operation]

  if(!operation) {
    throw new Error(`No operation '${data.operation}' on host API`)
  }

  Promise.resolve(operation.apply(null, patchParameters(data.parameters)))
    .then(value => {
      // hook up specific response handlers here...

      // default response is return the result and terminate the session
      send.ok({ type: 'static', value })
      terminate()
    })
    .catch(error => {
      send.error(error)
      terminate()
    })

  return { }
}

// JSON.stringify converts undefined array entries to null
// this causes issues - a default function parameter value
// is not used if null is passed, only undefined
const patchParameters = (args = []) => args.map(x => x === null ? undefined : x)
