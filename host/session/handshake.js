module.exports = (observable, context) => {
  const { hostApi, send, handshakeCallbacks, connection } = context
  const { data } = observable()
  const requestIsValid = data.version === '0.0.1'

  const handshakeData = Object.keys(handshakeCallbacks).reduce(
    (result, key) => ({ ...result, [key]: handshakeCallbacks[key](data, context) }),
    { operations: hostApi.operations() }
  )

  if(requestIsValid) {
    send.ok(handshakeData)
    observable.disconnect()
    connection.log.info('Connection handshake complete', { userAgent: data.userAgent })
  } else {
    throw new Error("Invalid handshake request")
  }
}