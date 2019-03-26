const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')
const { subject } = require('xest')

let server, socket, source

const setup = () => {
  server = new WebSocket.Server({ port: 1234 })
  source = subject({ initialValue: 'world' })
  hostModule(server, { log: { level: 'fatal' } }).useApi({ hello: () => source })
  return consumerModule({ 
    socketFactory: () => socket = new WebSocket('ws://localhost:1234'),
    reconnectDelay: 0
  })
    .useFeature('reestablishSessions').connect()
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

afterEach(() => server.close())

test("observable sessions are automatically reestablished", async () => {
  const api = await setup()
  const o = await api.hello()
  expect(o()).toBe('world')

  socket.close()
  source.publish('world2')

  await(delay(50))

  expect(o()).toBe('world2')
  source.publish('world3')

  await(delay(50))

  expect(o()).toBe('world3')
})