module.exports = (observable, { hostApi, send }) => {
  const { data } = observable()
  const requestIsValid = data.version === '0.0.1'

  if(requestIsValid) {
    send.ok({ 
      operations: hostApi.operations()
    })
    observable.disconnect()
  } else {
    throw new Error("Invalid handshake request")
  }
}