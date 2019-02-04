module.exports = ({ data }, { hostApi, send }) => {
  const requestIsValid = data.version === '0.0.1'

  if(requestIsValid) {
    send.ok({ 
      operations: Object.keys(hostApi).map(operation => ({ name: operation }))
    }, 'establish')
  } else {
    throw new Error("Invalid handshake request")
  }
}