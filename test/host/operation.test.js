const sessionFactory = require('../../host/session')
const sendWrapper = require('../../host/sendWrapper')
const { subject } = require('xest')

let sentFromHost, source

const setup = (api, initialValue) => {
  sentFromHost = jest.fn()
  source = subject({ initialValue })
  source.disconnect = jest.fn()
  sessionFactory(api).create(source, sendWrapper(x => x, { send: sentFromHost }, 1))
  return new Promise(setTimeout)
}

test("operation executes host API, returns result and disconnects session", async () => {
  await setup({ hello: () => 'world' }, {
    session: 'establish',
    type: 'operation',
    data: { operation: 'hello' } 
  })

  expect(sentFromHost.mock.calls).toEqual([[{
    id: 1,
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'world' }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation passes parameters to host API", async () => {
  await setup({ hello: (a, d) => a.b + a.c + d }, {
    session: 'establish',
    type: 'operation',
    data: { operation: 'hello', parameters: [{ b: 'wor', c: 1 }, 'd'] } 
  })

  expect(sentFromHost.mock.calls).toEqual([[{
    id: 1,
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'wor1d' }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation returns result of promise", async () => {
  await setup({ hello: () => new Promise(r => setTimeout(() => r('world'))) }, {
    session: 'establish',
    type: 'operation',
    data: { operation: 'hello' } 
  })
  expect(sentFromHost.mock.calls).toEqual([[{
    id: 1,
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'world' }
  }]])
})

test("operation returns error if API function does not exist", async () => {
  await setup({ }, {
    session: 'establish',
    type: 'operation',
    data: { operation: 'hello' } 
  })
  expect(sentFromHost.mock.calls).toEqual([[{
    id: 1,
    status: 'error',
    session: 'terminate',
    data: { message: "No operation 'hello' on host API" }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation returns error if API throws", async () => {
  await setup({ hello: () => { throw new Error('world') } }, {
    session: 'establish',
    type: 'operation',
    data: { operation: 'hello' } 
  })
  expect(sentFromHost.mock.calls[0][0]).toEqual({
    id: 1,
    session: 'terminate',
    status: 'error',
    data: { message: 'world' }
  })
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation returns error if API rejects promise", async () => {
  await setup({ hello: () => Promise.reject('world') }, {
    session: 'establish',
    type: 'operation',
    data: { operation: 'hello' } 
  })
  expect(sentFromHost.mock.calls[0][0]).toMatchObject({
    id: 1,
    session: 'terminate',
    status: 'error',
    data: { message: 'world' }
  })
  expect(source.disconnect.mock.calls.length).toBe(1)
})