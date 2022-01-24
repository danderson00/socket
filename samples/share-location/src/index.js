const index = require('@x/socket')
const { subject } = require('@x/observable')
const Websocket = require('ws')

const locations = subject()
const api = {
  locationStream: () => locations,
  registerLocation: ({ lat, lng, address }) => locations.publish({ lat, lng, address })
}
const middleware = {
  registerLocation: ({ connection, next }, location) => {
    next({ ...location, address: connection.socket._socket.remoteAddress })
  }
}

// this will only work from localhost due to page being hosted with SSL to enable geolocation
// to host on a remote server, create a https.Server here and configure with a certificate that is not self signed
const options = {
  server: new Websocket.Server({ port: 8081 })
}
index(options).useApi(api).use(middleware)

