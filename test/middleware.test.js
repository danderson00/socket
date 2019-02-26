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
    { echo: ({ args, next }) => next(args[1], args[0]) }
  )
  const result = await api.echo('test1', 'test2')
  expect(result).toBe('test2test1')
})

test("errors are returned from middleware", async () => {
  const api = await setup(
    { echo: text => `'${text}'` },
    { echo: ({ args }) => { throw new Error(args[0]) } }
  )
  await expect(api.echo('test')).rejects.toMatchObject({ message: 'test' })
})

test("connection is exposed to middleware", async () => {
  const api = await setup(
    { hello: () => 'world' },
    { 
      hello: ({ connection, next }) => {
        // this might be a bit flaky
        expect(Object.keys(connection)).toEqual(['id', 'messages', 'events', 'send'])
        return next() 
      }
    }
  )
  expect(await api.hello()).toBe('world')
})

test("context can be shared across calls using connection", async () => {
  const api = await setup({ 
      authenticate: username => ({ username, id: 1 }),
      getUser: () => {}
    }, {
      authenticate: async ({ connection, next }) => connection.user = await next(),
      getUser: ({ connection }) => connection.user
    }
  )
  await api.authenticate('test')
  expect(await api.getUser()).toEqual({ username: 'test', id: 1 })
})