const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = () => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server }, { log: { level: 'fatal' } })
    .useFeature('clientId', { cipherKey: 'secret' })
    .useApi({ getClientId: clientId => clientId })
    .use({
      getClientId: ({ connection, next }) => next(connection.clientId)
    })

  return consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234'), })
    .useFeature('clientId')
}

afterEach(() => server.close())

test("clientId is set on first connect", async () => {
  const { connect } = await setup()
  const clientId1 = await (await connect()).getClientId()
  const clientId2 = await (await connect()).getClientId()
  expect(clientId1).toEqual(clientId2)
})

test("clientId is reset when localStorage is cleared", async () => {
  const { connect } = await setup()
  const clientId1 = await (await connect()).getClientId()
  window.localStorage.clear()
  const clientId2 = await (await connect()).getClientId()
  expect(clientId1).not.toEqual(clientId2)
})

test("clientId is reset when cached key is corrupted", async () => {
  const { connect } = await setup()
  const clientId1 = await (await connect()).getClientId()
  window.localStorage.setItem('__socket__clientId', 'corrupted')
  const clientId2 = await (await connect()).getClientId()
  expect(clientId1).not.toEqual(clientId2)
})
