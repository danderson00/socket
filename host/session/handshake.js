module.exports = ({ data }, { hostApi, send, terminate }) => {
  const requestIsValid = data.version === '0.0.1'

  if(requestIsValid) {
    send.ok({ 
      operations: Object.keys(hostApi).map(operation => ({ name: operation }))
    }, 'establish')
  } else {
    send.error("Invalid handshake request")
    terminate()
  }
  
  return { }
}