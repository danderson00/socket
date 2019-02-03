const host = require('../host')
const consumer = require('../consumer')
const WebSocket = require('ws')
const { subject } = require('xest')

let server

const setup = async api => {
  server = new WebSocket.Server({ port: 1234 })
  host(server, api)
  return await consumer(new WebSocket('ws://localhost:1234'))
}

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
  await new Promise(setTimeout)
  expect(result()).toBe('world')
})

test("unsubscribe", async () => {
  const source = subject()
  const api = await setup({ hello: () => source })
  const result = await api.hello()
  result.disconnect()
  await new Promise(r => setTimeout(r, 1000))
  // source.publish('world')
  // await new Promise(setTimeout)
  // expect(result()).toBeUndefined()
}, 300000)