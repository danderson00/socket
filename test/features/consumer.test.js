const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = async feature => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule(server).useApi({ hello: () => 'world' })
  return await consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234') })
    .useFeature(feature).connect()
}

afterEach(() => server.close())

test("consumer feature constructors are passed returned API", async () => {
  await setup(({ api }) => {
    expect(api.hello).toBeInstanceOf(Function)
    return {}
  })
})

test("consumer feature constructors can be async to delay connect return", async () => {
  let setupReturned = false
  let setupExecuted = false
  await setup(() => new Promise(resolve => setTimeout(() => {
    expect(setupReturned).toBe(false)
    setupExecuted = true
    resolve({})
  })))
  setupReturned = true
  expect(setupExecuted).toBe(true)
})
