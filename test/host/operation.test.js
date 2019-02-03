const sessionFactory = require('../../host/session')
const sendWrapper = require('../../host/sendWrapper')

test("operation executes host API, returns result and terminates session", async () => {
  const receivedFromHost = jest.fn()
  const sessionTerminated = jest.fn()
  sessionFactory({ hello: () => 'world' }).create({
    session: 'establish',
    type: 'operation',
    operation: 'hello'
  }, sendWrapper(x => x, { send: receivedFromHost }, 1), sessionTerminated)
  await new Promise(setTimeout)
  expect(receivedFromHost.mock.calls[0][0]).toEqual({
    id: 1,
    session: 'terminate',
    status: 'ok',
    data: 'world'
  })
  expect(sessionTerminated.mock.calls.length).toBe(1)
})

test("operation returns result of promise", async () => {
  const receivedFromHost = jest.fn()
  sessionFactory({ hello: () => new Promise(r => setTimeout(() => r('world'))) }).create({
    session: 'establish',
    type: 'operation',
    operation: 'hello'
  }, sendWrapper(x => x, { send: receivedFromHost }, 1), jest.fn())
  await new Promise(setTimeout)
  expect(receivedFromHost.mock.calls).toEqual([[{
    id: 1,
    session: 'terminate',
    status: 'ok',
    data: 'world'
  }]])
})

test("operation returns error if API function does not exist", async () => {
  const receivedFromHost = jest.fn()
  const sessionTerminated = jest.fn()
  sessionFactory({ }).create({
    session: 'establish',
    type: 'operation',
    operation: 'hello'
  }, sendWrapper(x => x, { send: receivedFromHost }, 1), sessionTerminated)
  expect(receivedFromHost.mock.calls).toEqual([[{
    id: 1,
    status: 'error',
    session: 'terminate',
    data: { message: "No operation 'hello' on host API" }
  }]])
  expect(sessionTerminated.mock.calls.length).toBe(1)
})

test("operation returns error if API function does not exist", async () => {
  const receivedFromHost = jest.fn()
  const sessionTerminated = jest.fn()
  sessionFactory({ }).create({
    session: 'establish',
    type: 'operation',
    operation: 'hello'
  }, sendWrapper(x => x, { send: receivedFromHost }, 1), sessionTerminated)
  expect(receivedFromHost.mock.calls).toEqual([[{
    id: 1,
    status: 'error',
    session: 'terminate',
    data: { message: "No operation 'hello' on host API" }
  }]])
  expect(sessionTerminated.mock.calls.length).toBe(1)
})

test("operation returns error if API throws", async () => {
  const receivedFromHost = jest.fn()
  const sessionTerminated = jest.fn()
  sessionFactory({ hello: () => { throw new Error('world') } }).create({
    session: 'establish',
    type: 'operation',
    operation: 'hello'
  }, sendWrapper(x => x, { send: receivedFromHost }, 1), sessionTerminated)
  await new Promise(setTimeout)
  expect(receivedFromHost.mock.calls[0][0]).toEqual({
    id: 1,
    session: 'terminate',
    status: 'error',
    data: { message: 'world' }
  })
  expect(sessionTerminated.mock.calls.length).toBe(1)
})

test("operation returns error if API rejects promise", async () => {
  const receivedFromHost = jest.fn()
  const sessionTerminated = jest.fn()
  sessionFactory({ hello: () => Promise.reject('world') }).create({
    session: 'establish',
    type: 'operation',
    operation: 'hello'
  }, sendWrapper(x => x, { send: receivedFromHost }, 1), sessionTerminated)
  await new Promise(setTimeout)
  expect(receivedFromHost.mock.calls[0][0]).toMatchObject({
    id: 1,
    session: 'terminate',
    status: 'error',
    data: { message: 'world' }
  })
  expect(sessionTerminated.mock.calls.length).toBe(1)
})