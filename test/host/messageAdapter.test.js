const messageAdapter = require('../../host/messageAdapter')
const logger = require('../../host/logger')

test("adapter calls into host API and responds with result", async () => {
  const socket = { send: jest.fn() }
  const api = { hello: () => 'world' }
  const adapter = messageAdapter(socket, api, logger(), {})
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
  const adapter = messageAdapter(socket, api, logger(), {})
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
  const adapter = messageAdapter(socket, api, logger(-1), {})
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

test("adapter responds with error on rejected promise", async () => {
  const socket = { send: jest.fn() }
  const api = { error: () => Promise.reject('test') }
  const adapter = messageAdapter(socket, api, logger(-1), {})
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

test("adapter responds with error after timeout", async () => {
  const socket = { send: jest.fn() }
  const api = { timeout: () => new Promise(resolve => setTimeout(() => resolve('result'), 10)) }
  const adapter = messageAdapter(socket, api, logger(-1), { timeout: 10 })
  await adapter(JSON.stringify({
    id: 1,
    operation: 'timeout'
  }))
  expect(socket.send.mock.calls.length).toBe(2)
  expect(JSON.parse(socket.send.mock.calls[0][0])).toMatchObject({
    id: 1,
    operation: 'timeout',
    status: 'error',
    data: { message: 'timeout operation timed out after 10ms' }
  })
  // we still get a response with a `timeout` status if the operation eventually completes
  expect(JSON.parse(socket.send.mock.calls[1][0])).toMatchObject({
    id: 1,
    operation: 'timeout',
    status: 'timeout',
    data: 'result'
  })
})