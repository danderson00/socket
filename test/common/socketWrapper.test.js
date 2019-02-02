const socketWrapper = require('../../common/socketWrapper')
const EventEmitter = require('events')

test("wrapper serializes outgoing messages", () => {
  const socket = { send: jest.fn() }
  const wrapper = socketWrapper(socket)
  wrapper.send({ a: 'b' })
  expect(socket.send.mock.calls.length).toBe(1)
  expect(socket.send.mock.calls[0][0]).toBe('{"a":"b"}')
})

test("wrapper deserializes incoming messages", () => {
  const socket = new EventEmitter()
  socket.addEventListener = socket.addListener
  const wrapper = socketWrapper(socket)
  const handler = jest.fn()
  wrapper.addMessageHandler(handler)
  socket.emit('message', JSON.stringify({ a: 'b' }))
  expect(handler.mock.calls.length).toBe(1)
  expect(handler.mock.calls[0][0]).toEqual({ a: 'b' })
})

test("wrapper sends error when incoming message is not JSON", () => {
  const socket = new EventEmitter()
  socket.addEventListener = socket.addListener
  socket.send = jest.fn()
  const wrapper = socketWrapper(socket)
  wrapper.addMessageHandler(jest.fn())
  socket.emit('message', 'hello')
  expect(socket.send.mock.calls.length).toBe(1)
  expect(socket.send.mock.calls[0][0]).toEqual(JSON.stringify({ status: 'error', data: { message: 'Socket data must be JSON' } }))
})

test("message handlers are removed correctly", () => {
  const socket = new EventEmitter()
  socket.addEventListener = socket.addListener
  socket.removeEventListener = socket.removeListener
  const wrapper = socketWrapper(socket)
  const handler = jest.fn()
  wrapper.addMessageHandler(handler)
  socket.emit('message', JSON.stringify({ a: 'b' }))
  wrapper.removeMessageHandler(handler)
  socket.emit('message', JSON.stringify({ a: 'c' }))
  expect(handler.mock.calls.length).toBe(1)
})