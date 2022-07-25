module.exports = (observable, context) => {
  const { hostApi, send, handshakeCallbacks, connection } = context

  connection.disconnectTimeout.cancel()

  try {
    const { data } = observable()
    const requestIsValid = data.version === '0.0.1'

    const handshakeData = Object.keys(handshakeCallbacks).reduce(
      (result, key) => ({ ...result, [key]: handshakeCallbacks[key](data, context) }),
      { operations: hostApi.operations() }
    )

    connection.handshake = { success: requestIsValid, hostData: handshakeData, consumerData: data }

    if (requestIsValid) {
      send.ok(handshakeData)
      connection.log.info('Connection handshake complete', { userAgent: data.userAgent, screen: data.screen })
    } else {
      connection.log.error('Invalid handshake request')
      connection.disconnect()
    }
  } catch(error) {
    connection.log.error('Invalid handshake request', error)
    connection.disconnect()
  } finally {
    observable.disconnect()
  }
}