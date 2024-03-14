const reliableSocket = require('../../../consumer/reliableSocket')
const serializerModule = require('../../../common/serializer')
const log = require('../../../common/logger')('none')
const enableDestroy = require('../../enableDestroy')
const WebSocket = require('ws')

let servers = []
afterEach(() => {
  servers.forEach(x => x.close())
  servers = []
})

const createServer = () => {
  const server = new WebSocket.Server({ port: 1234, clientTracking: true })
  enableDestroy(server)
  // const server = WebSocketServer({ port: 1234, clientTracking: true })
  const connections = []
  server.on('connection', socket => {
    const messages = jest.fn()
    socket.on('message', messages)
    connections.push({
      messages: messages.mock,
      send: message => socket.send(message)
    })
  })
  const result = { close: () => server.destroy(), connections }
  servers.push(result)
  return result
}

let lastWebSocket
const socketFactory = () => lastWebSocket = new WebSocket('ws://localhost:1234')
const serializer = serializerModule()
const { deserialize } = serializer
const delay = ms => new Promise(r => setTimeout(r, ms))

test("socket immediately connects", async () => {
  const server = createServer()
  reliableSocket({ socketFactory }, () => {}, () => {}, serializer, log)
  await delay(50)
  expect(server.connections.length).toBe(1)
})

test("socket continues sending with new socket after disconnect", async () => {
  const server = createServer()
  const socket = reliableSocket({ socketFactory, reconnectDelay: 0 }, () => {}, () => {}, serializer, log)
  const messages = jest.fn()
  socket.messages.subscribe(messages)
  const promise1 = socket.send({ value: 1 })
  const promise2 = socket.send({ value: 2 })
  await delay(50)
  expect(server.connections.length).toBe(1)
  expect(server.connections[0].messages.calls.length).toBe(2)
  expect(deserialize(server.connections[0].messages.calls[0][0])).toEqual({ value: 1, src: 2, commandId: 1 })
  expect(deserialize(server.connections[0].messages.calls[1][0])).toEqual({ value: 2, src: 2, commandId: 2 })
  server.connections[0].send(JSON.stringify({ commandId: 1, src: 1, status: 'ack' }))
  lastWebSocket.close()
  await promise1
  await delay(50)
  expect(server.connections.length).toBe(2)
  const promise3 = socket.send({ value: 3 })
  await delay(50)
  expect(server.connections[1].messages.calls.length).toBe(1)
  server.connections[1].send(JSON.stringify({ commandId: 2, src: 1, status: 'ack' }))
  await promise2
  await delay(50)
  expect(messages.mock.calls).toEqual([
    [{ commandId: 1, src: 1, status: 'ack'}],
    [{ commandId: 2, src: 1, status: 'ack'}]
  ])
  server.connections[1].send(JSON.stringify({ commandId: 3, src: 1, status: 'ack' }))
  await promise3
})

// this may be flaky depending on how fast your computer is
test("socket continues retrying to connect if server unavailable", async () => {
  let server = createServer()
  const socketFactory = jest.fn(() => new WebSocket('ws://localhost:1234', { handshakeTimeout: 10 }))
  const socket = reliableSocket({ socketFactory, reconnectDelay: 50 }, () => {}, () => {}, serializer, log)
  const messages = jest.fn()
  socket.messages.subscribe(messages)
  const promise1 = socket.send({ value: 1 })
  const promise2 = socket.send({ value: 2 })
  await delay(50)
  server.connections[0].send(JSON.stringify({ commandId: 1, src: 1, status: 'ack' }))
  server.close()
  // wait for enough time for 3 reconnect attempts to occur (reconnectDelay: 50)
  await delay(170)
  expect(socketFactory.mock.calls.length).toBe(3)
  await promise1
  server = createServer()
  await delay(200)
  server.connections[1].send(JSON.stringify({ commandId: 2, src: 1, status: 'ack' }))
  await promise2
})

test("socket calls onConnect function and awaits promise on each connect", async () => {
  let server = createServer()
  const socketFactory = jest.fn(() => new WebSocket('ws://localhost:1234'))
  const onConnect = jest.fn(() => delay(10))
  reliableSocket({ socketFactory, reconnectDelay: 0 }, onConnect, () => {}, serializer, log)
  await delay(50)
  expect(socketFactory.mock.calls.length).toBe(1)
  expect(onConnect.mock.calls.length).toBe(1)
  server.close()
  server = createServer()
  await delay(110)
  expect(socketFactory.mock.calls.length).toBe(2)
  expect(onConnect.mock.calls.length).toBe(2)
  server.close()
  createServer()
  await delay(60)
  expect(socketFactory.mock.calls.length).toBe(3)
  expect(onConnect.mock.calls.length).toBe(3)
})

test("socket calls onDisconnect function and awaits promise before reconnecting", async () => {
  let server = createServer()
  const socketFactory = jest.fn(() => new WebSocket('ws://localhost:1234'))
  const onDisconnect = jest.fn(() => delay(10))
  reliableSocket({ socketFactory, reconnectDelay: 0 }, () => {}, onDisconnect, serializer, log)
  await delay(50)
  expect(socketFactory.mock.calls.length).toBe(1)
  expect(onDisconnect.mock.calls.length).toBe(0)
  server.close()
  server = createServer()
  await delay(10)
  expect(socketFactory.mock.calls.length).toBe(1)
  expect(onDisconnect.mock.calls.length).toBe(1)
  await delay(50)
  expect(socketFactory.mock.calls.length).toBe(2)
  expect(onDisconnect.mock.calls.length).toBe(1)
  server.close()
  createServer()
  await delay(50)
  expect(socketFactory.mock.calls.length).toBe(3)
  expect(onDisconnect.mock.calls.length).toBe(2)
})