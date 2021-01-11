const host = require('../host')
const consumer = require('../consumer')
const WebSocket = require('ws')
const { subject } = require('@xest/core')

let server

const setup = async (api, options) => {
  server = new WebSocket.Server({ port: 1234 })
  host({ server }, { log: { level: 'fatal' }, ...options }).useApi(api)
  return await createConsumer()
}
const delay = delay => new Promise(resolve => setTimeout(resolve, delay))
const createConsumer = () => consumer({
  socketFactory: () => new WebSocket('ws://localhost:1234'),
  log: { level: 'fatal' }
}).connect()
afterEach(() => server.close())

test("observable initial value", async () => {
  const api = await setup({ hello: () => subject({ initialValue: 'world' }) })
  const result = await api.hello()
  expect(result()).toBe('world')
})

test("observable publish", async () => {
  const source = subject()
  const api = await setup({ hello: () => source })
  const result = await api.hello()
  source.publish('world')
  await delay(10)
  expect(result()).toBe('world')
})

test("unsubscribe", async () => {
  const source = subject()
  const api = await setup({ hello: () => source })
  const result = await api.hello()
  result.disconnect()
  source.publish('world')
  await delay(10)
  expect(result()).toBeUndefined()
})

test("multiple consumers", async () => {
  const source = subject()
  const api1 = await setup({ hello: () => source })
  const result1 = await api1.hello()
  const api2 = await createConsumer()
  const result2 = await api2.hello()
  source.publish('world')
  await delay(10)
  expect(result1()).toBe('world')
  expect(result2()).toBe('world')
})

test("initial errorObservable value is populated", async () => {
  const source = subject()
  source.errorObservable.report(new Error('test'))
  const api = await setup({ hello: () => source })
  const result = await api.hello()
  expect(result.errorObservable()).toEqual([
    { error: { message: 'test' } }
  ])
})

test("published errorObservable value is populated", async () => {
  const source = subject()
  const api = await setup({ hello: () => source })
  const result = await api.hello()
  source.errorObservable.report(new Error('test'))
  await delay(50)
  expect(result.errorObservable()).toEqual([
    { error: { message: 'test' } }
  ])
})

test("serializer.errorDetail option controls error serialization", async () => {
  const source = subject()
  source.errorObservable.report(new Error('test'))
  const api = await setup({ hello: () => source }, { serializer: { errorDetail: 'none' } })
  const result = await api.hello()
  expect(result.errorObservable()).toEqual([
    { error: { message: 'An error occurred' } }
  ])
})
