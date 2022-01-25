const host = require('@x/socket')
const { subject } = require('@x/observable')
const Websocket = require('ws')

// an observable that encapsulates the stream of location updates
const locationStream = subject()

// a simple API to obtain the locationStream and publish a location update
const api = {
  locationStream: () => locationStream,
  registerLocation: ({ lat, lng, address, clientId }) => (
    locationStream.publish({ lat, lng, address, clientId })
  )
}

// middleware to inject specific connection properties into the payload object
const middleware = {
  registerLocation: ({ connection, next }, location) => {
    return next({
      ...location,
      clientId: connection.clientId,
      address: connection.socket._socket.remoteAddress
    })
  }
}

// this will only work from localhost without SSL - accessing geolocation requires an encrypted connection.
// to host on a remote server, create an https.Server here and configure with a certificate that is not self signed
host({ server: new Websocket.Server({ port: 8081 }) })
  // enable the clientId feature to uniquely identify consumer devices
  .useFeature('clientId', { cipherKey: 'ENCRYPTION_KEY' })
  .use(middleware)
  .useApi(api)

