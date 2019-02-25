const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

let server

const setup = async (api, middleware) => {
  server = new WebSocket.Server({ port: 1234 })
  const host = hostModule(server)
  host.use(middleware)
  host.useApi(api)
  return await consumerModule(new WebSocket('ws://localhost:1234'))
}

afterEach(() => server.close())

test("simple middleware", async () => {
  const api = await setup(
    { echo: (text1, text2) => `${text1}${text2}` },
    { echo: (text1, text2) => [text2, text1] }
  )
  const result = await api.echo('test1', 'test2')
  expect(result).toBe('test2test1')
})

test("errors are returned from middleware", async () => {
  const api = await setup(
    { echo: text => `'${text}'` },
    { echo: text => { throw new Error(text) } }
  )
  await expect(api.echo('test')).rejects.toMatchObject({ message: 'test' })
})
