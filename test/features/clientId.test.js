const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = async () => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server })
    .useFeature('clientId')
    .useApi({ getClientId: clientId => clientId })
    .use({
      getClientId: ({ connection, next }) => next(connection.clientId)
    })

  return await consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234'), })
    .useFeature('clientId')
    .connect()
}

afterEach(() => server.close())

test("", async () => {
})