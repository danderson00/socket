const sessionFactory = require('../../../host/session')
const sendWrapper = require('../../../host/sendWrapper')
const logger = require('../../../common/logger')
const { subject } = require('xest')

let sentFromHost, source

const setup = (api, data = {}, events) => {
  const executor = {
    execute: (name, parameters) => Promise.resolve(api.apply(null, parameters))
  }
  sentFromHost = jest.fn()
  source = subject({ initialValue: {
    session: 'establish',
    type: 'operation',
    data: { operation: 'api', ...data } 
  }})
  source.disconnect = jest.fn()
  sessionFactory(executor, logger({ level: 'fatal' })).create(source, sendWrapper(sentFromHost, 1), { events: events || subject() })
  return new Promise(setTimeout)
}

test("operation executes host API, returns result and disconnects session", async () => {
  await setup(() => 'world')

  expect(sentFromHost.mock.calls).toEqual([[{
    sessionId: 1,
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'world' }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation passes parameters to host API", async () => {
  await setup((a, d) => a.b + a.c + d, {
    parameters: [{ b: 'wor', c: 1 }, 'd']
  })

  expect(sentFromHost.mock.calls).toEqual([[{
    sessionId: 1,
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'wor1d' }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation returns result of promise", async () => {
  await setup(() => new Promise(r => setTimeout(() => r('world'))))
  expect(sentFromHost.mock.calls).toEqual([[{
    sessionId: 1,
    session: 'terminate',
    status: 'ok',
    data: { type: 'static', value: 'world' }
  }]])
})

test("operation returns error if API function does not exist", async () => {
  await setup()
  expect(sentFromHost.mock.calls).toEqual([[{
    sessionId: 1,
    status: 'error',
    session: 'terminate',
    data: { message: "Cannot read property 'apply' of undefined" }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation returns error if API throws", async () => {
  await setup(() => { throw new Error('world') })
  expect(sentFromHost.mock.calls[0][0]).toEqual({
    sessionId: 1,
    session: 'terminate',
    status: 'error',
    data: { message: 'world' }
  })
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation returns error if API rejects promise", async () => {
  await setup(() => Promise.reject('world'), )
  expect(sentFromHost.mock.calls[0][0]).toMatchObject({
    sessionId: 1,
    session: 'terminate',
    status: 'error',
    data: { message: 'world' }
  })
  expect(source.disconnect.mock.calls.length).toBe(1)
})

test("operation returns persistent session if API returns observable", async () => {
  const observable = subject({ initialValue: 'world' })
  await setup(() => observable)
  expect(sentFromHost.mock.calls).toEqual([[{
    sessionId: 1,
    session: 'persistent',
    status: 'ok',
    data: { type: 'observable', value: 'world' }
  }]])
  expect(source.disconnect.mock.calls.length).toBe(0)

  observable.publish('update')
  expect(sentFromHost.mock.calls[1]).toEqual([{
    sessionId: 1,
    status: 'update',
    data: { value: 'update' }
  }])
})

test("sending session terminate disconnects observable", async () => {
  const observable = subject({ initialValue: 'world' })
  await setup(() => observable)
  source.publish({ session: 'terminate' })
  observable.publish('update')
  expect(sentFromHost.mock.calls.length).toBe(1)
})

test("operation disconnects from result observable when connection closes", async () => {
  const result = subject()
  result.disconnect = jest.fn()
  const events = subject()
  await setup(() => result, undefined, events)

  events.publish({ topic: 'close' })
  expect(result.disconnect.mock.calls.length).toBe(1)
})

test("operation disconnects from result observable when connection errors", async () => {
  const result = subject()
  result.disconnect = jest.fn()
  const events = subject()
  await setup(() => result, undefined, events)

  events.publish({ topic: 'error' })
  expect(result.disconnect.mock.calls.length).toBe(1)
})