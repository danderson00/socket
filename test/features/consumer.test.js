const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = feature => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule(server).useApi({ hello: () => 'world' })
  return consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234') })
    .useFeature(feature).connect()
}

afterEach(() => server.close())

test("consumer feature constructors are passed returned API", async () => {
  await setup(({ api }) => {
    expect(api.hello).toBeInstanceOf(Function)
    return { name: 'test' }
  })
})

test("consumer feature constructors can be async to delay connect return", async () => {
  let setupReturned = false
  let setupExecuted = false
  await setup(() => new Promise(resolve => setTimeout(() => {
    expect(setupReturned).toBe(false)
    setupExecuted = true
    resolve({ name: 'test' })
  })))
  setupReturned = true
  expect(setupExecuted).toBe(true)
})

test("consumer feature constructors are passed sessions object", async () => {
  let s
  const consumer = await setup(({ sessions }) => {
    s = sessions
    return { name: 'test' }
  })
  expect(s.get().length).toBe(0)
  const promise = consumer.hello()
  expect(s.get().length).toBe(1)
  await promise
  expect(s.get().length).toBe(0)
})