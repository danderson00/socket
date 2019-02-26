const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

let server

const setup = async feature => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule(server).useApi({ hello: () => 'world' })
  return await consumerModule(new WebSocket('ws://localhost:1234')).useFeature(feature).connect()
}

afterEach(() => server.close())

test("feature initializers are passed returned API", async () => {
  await setup({ 
    initialize: ({ api }) => expect(api.hello).toBeInstanceOf(Function)
  })
})
