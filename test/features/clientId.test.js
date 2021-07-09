const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = async () => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server })
    .useFeature('clientId')
    .use({
      getClientId: ({ next, connection }) => next(connection.clientId)
    })
    .useApi({
      getClientId: clientId => ({ clientId })
    })

  const socketFactory = () => new WebSocket('ws://localhost:1234')
  const connect = consumerModule({ socketFactory }).connect

  return { connect }
}

afterEach(() => server.close())

test("clientId is attached to connection object", async () => {
  const { connect } = await setup()
  const api = await connect()
  const result = await api.getClientId()
  expect(typeof result.clientId).toBe('string')
})
