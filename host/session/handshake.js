module.exports = (observable, context) => {
  const { hostApi, send, handshakeCallbacks } = context
  const { data } = observable()
  const requestIsValid = data.version === '0.0.1'

  const handshakeData = Object.keys(handshakeCallbacks).reduce(
    (data, key) => ({ ...data, [key]: handshakeCallbacks[key](context) }),
    { operations: hostApi.operations() }
  )

  if(requestIsValid) {
    send.ok(handshakeData)
    observable.disconnect()
  } else {
    throw new Error("Invalid handshake request")
  }
}