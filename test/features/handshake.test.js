const hostModule = require('../../host')
const WebSocket = require('ws')

let client, host, server, sentFromHost

const openSocket = () => new Promise(resolve => {
  const socket = new WebSocket('ws://localhost:1234')
  socket.on('open', () => resolve(socket))
})

const setup = async handshake => {
  const feature = () => ({ name: 'test', handshake })
  server = new WebSocket.Server({ port: 1234 })
  host = hostModule({ server }, { log: { level: 'fatal' } }).useFeature(feature)
  client = await openSocket()
  sentFromHost = jest.fn()
  client.on('message', sentFromHost)
}

const delay = delay => new Promise(r => setTimeout(r, delay))

afterEach(() => server.close())

test("handshake returns feature data", async () => {
  const spy = jest.fn(() => ({ p1: 1 }))
  await setup(spy)
  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'handshake',
    data: { version: '0.0.1' },
    commandId: 1
  }))
  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([
    [JSON.stringify({ commandId: 1, status: 'ack' })],
    [JSON.stringify({
      status: 'ok',
      data: {
        operations: [],
        test: { p1: 1 }
      },
      session: 'terminate',
      sessionId: 1
    })]
  ])
})
