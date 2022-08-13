const hostModule = require('../../host')
const consumerModule = require('../../consumer')
const WebSocket = require('ws')

let server

const setup = (config, callback) => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server, log: { level: 'fatal' } })
    .useFeature('configuration', config)

  return consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234'), })
    .useFeature('configuration', callback).connect()
}

afterEach(() => server.close())

test("static values are passed from host to consumer", async () => {
  const callback = jest.fn()
  await setup({ p1: 1 }, callback)
  expect(callback.mock.calls).toEqual([[{ p1: 1 }]])
})
