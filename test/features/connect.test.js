const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = async feature => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule(server).useApi({ hello: () => 'world' })
  return await consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234'), reconnectDelay: 0 })
    .useFeature(feature).connect()
}

afterEach(() => server.close())
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

test("feature connect functions are executed on each reconnect", async () => {
  const connect = jest.fn()
  await setup(() => ({ name: 'test', connect }))
  server.close()
  server = new WebSocket.Server({ port: 1234 })
  await(delay(50))
  expect(connect.mock.calls.length).toBe(1)
  server.close()
  server = new WebSocket.Server({ port: 1234 })
  await(delay(50))
  expect(connect.mock.calls.length).toBe(2)
})
