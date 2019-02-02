const messageAdapter = require('../host/messageAdapter')
const logger = require('../host/logger')

test("adapter calls into host API and responds with result", async () => {
  const socket = { send: jest.fn() }
  const api = { hello: () => 'world' }
  const adapter = messageAdapter(socket, api, logger())
  await adapter(JSON.stringify({
    id: 1,
    operation: 'hello'
  }))
  expect(socket.send.mock.calls.length).toBe(1)
  expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({
    id: 1,
    operation: 'hello',
    status: 'ok',
    data: 'world'
  })
})

test("adapter handles async host API functions", async () => {
  const socket = { send: jest.fn() }
  const api = { hello: () => new Promise(resolve => setTimeout(() => resolve('world'))) }
  const adapter = messageAdapter(socket, api, logger())
  await adapter(JSON.stringify({
    id: 1,
    operation: 'hello'
  }))
  expect(socket.send.mock.calls.length).toBe(1)
  expect(JSON.parse(socket.send.mock.calls[0][0]).data).toBe('world')
})

test("adapter responds with error on exception", async () => {
  const socket = { send: jest.fn() }
  const api = { error: () => { throw new Error('test') } }
  const adapter = messageAdapter(socket, api, logger(-1))
  await adapter(JSON.stringify({
    id: 1,
    operation: 'error'
  }))
  expect(socket.send.mock.calls.length).toBe(1)
  expect(JSON.parse(socket.send.mock.calls[0][0])).toMatchObject({
    id: 1,
    operation: 'error',
    status: 'error',
    data: { message: 'test' }
  })
})