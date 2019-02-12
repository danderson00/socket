const hostModule = require('../../host')
const WebSocket = require('ws')

const openSocket = () => new Promise(resolve => {
  const socket = new WebSocket('ws://localhost:1234')
  socket.on('open', () => resolve(socket))
})

const delay = delay => new Promise(r => setTimeout(r, delay))

test("basic API call", async () => {
  const server = new WebSocket.Server({ port: 1234 })
  const host = hostModule(server, { hello: 'world' })
  const client = await openSocket()
  const sentFromHost = jest.fn()
  client.on('message', sentFromHost)

  client.send(JSON.stringify({
    sessionId: 1,
    session: 'establish',
    type: 'operation',
    data: { operation: 'hello' } 
  }))

  await delay(10)

  expect(sentFromHost.mock.calls).toEqual([[JSON.stringify({
    sessionId: 1,
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'world' }
  })]])
})