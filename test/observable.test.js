const host = require('../host')
const consumer = require('../consumer')
const WebSocket = require('ws')
const { subject } = require('xest')

let server

const setup = async api => {
  server = new WebSocket.Server({ port: 1234 })
  host(server, { log: { level: 'none' } }).useApi(api)
  return await consumer({ socketFactory: () => new WebSocket('ws://localhost:1234') }).connect()
}

afterEach(() => server.close())

const delay = delay => new Promise(resolve => setTimeout(resolve, delay))

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