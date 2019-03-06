const host = require('../host')
const consumer = require('../consumer')
const WebSocket = require('ws')
const { subject } = require('xest')

let server

const setup = async api => {
  server = new WebSocket.Server({ port: 1234 })
  host(server, { log: { level: 'fatal' } }).useApi(api)
  return await createConsumer()
}
const delay = delay => new Promise(resolve => setTimeout(resolve, delay))
const createConsumer = () => consumer({ socketFactory: () => new WebSocket('ws://localhost:1234') }).connect()
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