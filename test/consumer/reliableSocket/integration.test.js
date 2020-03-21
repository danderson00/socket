const reliableSocket = require('../../../consumer/reliableSocket')
const serializerModule = require('../../../common/serializer')
const log = require('../../../common/logger')('none')
const WebSocket = require('ws')

let servers = []
afterEach(() => {
  servers.forEach(x => x.close())
  servers = []
})

const createServer = () => {
  const server = new WebSocket.Server({ port: 1234 })
  const connections = []
  server.on('connection', socket => {
    const messages = jest.fn()
    socket.on('message', messages)
    connections.push({
      messages: messages.mock,
      send: message => socket.send(message)
    })
  })
  const result = { close: () => server.close(), connections }
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
  const socket = reliableSocket({ serializer, socketFactory }, () => {}, log)
  await delay(50)
  expect(server.connections.length).toBe(1)
})

// this is no longer the case since reliableSend is used instead of queue
// test("socket queues messages and awaits ack in order", async () => {
//   const server = createServer()
//   const socket = reliableSocket({ serializer, socketFactory }, () => {}, log)
//   const messages = jest.fn()
//   socket.messages.subscribe(messages)
//   socket.send({ value: 1 })
//   socket.send({ value: 2 })
//   socket.send({ value: 3 })
//   await delay(50)
//   expect(server.connections[0].messages.calls.length).toBe(1)
//   expect(deserialize(server.connections[0].messages.calls[0][0])).toEqual({ value: 1, commandId: 1 })
//   server.connections[0].send(JSON.stringify({ commandId: 1, status: 'ack' }))
//   await delay(50)
//   expect(server.connections[0].messages.calls.length).toBe(2)
//   expect(deserialize(server.connections[0].messages.calls[1][0])).toEqual({ value: 2, commandId: 2 })
//   server.connections[0].send(JSON.stringify({ commandId: 2, status: 'ack' }))
//   await delay(50)
//   expect(server.connections[0].messages.calls.length).toBe(3)
//   expect(deserialize(server.connections[0].messages.calls[2][0])).toEqual({ value: 3, commandId: 3 })
//   expect(messages.mock.calls).toEqual([
//     [{ commandId: 1, status: 'ack'}],
//     [{ commandId: 2, status: 'ack'}]
//   ])
// })

test("socket continues sending with new socket after disconnect", async () => {
  const server = createServer()
  const socket = reliableSocket({ serializer, socketFactory, reconnectDelay: 0 }, () => {}, log)
  const messages = jest.fn()
  socket.messages.subscribe(messages)
  const promise1 = socket.send({ value: 1 })
  const promise2 = socket.send({ value: 2 })
  await delay(50)
  expect(server.connections.length).toBe(1)
  expect(server.connections[0].messages.calls.length).toBe(2)
  expect(deserialize(server.connections[0].messages.calls[0][0])).toEqual({ value: 1, commandId: 1 })
  expect(deserialize(server.connections[0].messages.calls[1][0])).toEqual({ value: 2, commandId: 2 })
  server.connections[0].send(JSON.stringify({ commandId: 1, status: 'ack' }))
  lastWebSocket.close()
  await promise1
  await delay(50)
  expect(server.connections.length).toBe(2)
  const promise3 = socket.send({ value: 3 })
  await delay(50)
  expect(server.connections[1].messages.calls.length).toBe(1)
  server.connections[1].send(JSON.stringify({ commandId: 2, status: 'ack' }))
  await promise2
  await delay(50)
  expect(messages.mock.calls).toEqual([
    [{ commandId: 1, status: 'ack'}],
    [{ commandId: 2, status: 'ack'}]
  ])
  server.connections[1].send(JSON.stringify({ commandId: 3, status: 'ack' }))
  await promise3
})

// this may be flaky depending on how fast your computer is
test("socket continues retrying to connect if server unavailable", async () => {
  let server = createServer()
  const socketFactory = jest.fn(() => new WebSocket('ws://localhost:1234', { handshakeTimeout: 10 }))
  const socket = reliableSocket({ serializer, socketFactory, reconnectDelay: 50 }, () => {}, log)
  const messages = jest.fn()
  socket.messages.subscribe(messages)
  const promise1 = socket.send({ value: 1 })
  const promise2 = socket.send({ value: 2 })
  await delay(50)
  server.connections[0].send(JSON.stringify({ commandId: 1, status: 'ack' }))
  server.close()
  // wait for enough time for 3 reconnect attempts to occur (reconnectDelay: 50)
  await delay(150)
  expect(socketFactory.mock.calls.length).toBe(3)
  await promise1
  server = createServer()
  await delay(100)
  server.connections[1].send(JSON.stringify({ commandId: 2, status: 'ack' }))
  await promise2
})

test("socket calls onConnect function and awaits promise on each connect", async () => {
  let server = createServer()
  const socketFactory = jest.fn(() => new WebSocket('ws://localhost:1234'))
  const onConnect = jest.fn(() => delay(10))
  const socket = reliableSocket({ serializer, socketFactory, reconnectDelay: 0 }, onConnect, log)  
  await delay(50)
  expect(socketFactory.mock.calls.length).toBe(1)
  expect(onConnect.mock.calls.length).toBe(1)
  server.close()
  server = createServer()
  await delay(50)
  expect(socketFactory.mock.calls.length).toBe(2)
  expect(onConnect.mock.calls.length).toBe(2)
  server.close()
  server = createServer()
  await delay(50)
  expect(socketFactory.mock.calls.length).toBe(3)
  expect(onConnect.mock.calls.length).toBe(3)
})