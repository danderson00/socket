const handshake = require('../../host/handshake')

test("handshake responds with host API operations when successful", async () => {
  let target
  const socket = { 
    send: jest.fn(), 
    addEventListener: (type, handler) => target = handler,
    removeEventListener: jest.fn()
  }
  handshake(socket, { hello: () => {} })
  target('{"version":"0.0.1"}')
  expect(socket.send.mock.calls.length).toBe(1)
  expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({
    status: 'ok',
    operations: [{ name: 'hello' }]
  })
  expect(socket.removeEventListener.mock.calls.length).toBe(1)
})

test("handshake responds with error when request is not JSON", async () => {
  let target
  const socket = { 
    send: jest.fn(), 
    addEventListener: (type, handler) => target = handler,
    removeEventListener: jest.fn()
  }
  handshake(socket, { hello: () => {} }).catch(() => {}) // ignore these errors here
  target('helo')
  expect(socket.send.mock.calls.length).toBe(1)
  expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({
    status: 'error',
    data: { message: 'Request was not JSON: helo' }
  })
  expect(socket.removeEventListener.mock.calls.length).toBe(1)
})

test("handshake responds with error when unsuccessful", async () => {
  let target
  const socket = { 
    send: jest.fn(), 
    addEventListener: (type, handler) => target = handler,
    removeEventListener: jest.fn()
  }
  handshake(socket, { hello: () => {} }).catch(() => {})
  target('{"a":"b"}')
  expect(socket.send.mock.calls.length).toBe(1)
  expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({
    status: 'error',
    data: { message: 'Incorrect version' }
  })
  expect(socket.removeEventListener.mock.calls.length).toBe(1)
})