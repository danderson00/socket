const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

let server, currentSocket

const setup = async (api, hostMiddleware, consumerMiddleware) => {
  server = new WebSocket.Server({ port: 1234 })
  hostModule({ server, log: { level: 'fatal' } })
    .use(hostMiddleware)
    .useApi(api)
  return await consumerModule({ socketFactory: () => currentSocket = new WebSocket('ws://localhost:1234') })
    .use(consumerMiddleware)
    .connect()
}

afterEach(() => server.close())

test("simple middleware", async () => {
  const api = await setup(
    { echo: (text1, text2) => `${text1}${text2}` },
    { echo: ({ next }, text1, text2) => next(text2, text1) }
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
        expect(Object.keys(connection)).toEqual(
          ['id', 'log', 'socket', 'request', 'messages', 'events', 'send', 'observables', 'sessions', 'handshake']
        )
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

test("simple consumer middleware", async () => {
  const api = await setup(
    { echo: (text1, text2) => `${text1}${text2}` },
    undefined,
    { echo: ({ next }, text1, text2) => next(text2, text1) }
  )
  const result = await api.echo('test1', 'test2')
  expect(result).toBe('test2test1')
})

test("async consumer middleware", async () => {
  const api = await setup(
    { echo: (text1, text2) => `${text1}${text2}` },
    undefined,
    { echo: ({ next }, text1, text2) => new Promise(resolve => setTimeout(async () => resolve(await next(text2, text1)), 10)) }
  )
  const result = await api.echo('test1', 'test2')
  expect(result).toBe('test2test1')
})

test("consumer middleware modifying result", async () => {
  const api = await setup(
    { echo: (text1, text2) => `${text1}${text2}` },
    undefined,
    { echo: async ({ next }) => `${await next()}!` }
  )
  const result = await api.echo('test1', 'test2')
  expect(result).toBe('test1test2!')
})

test("connection observables are disconnected when socket closes", async () => {
  const disconnect = jest.fn()
  const api = await setup(
    { test: () => {} },
    { test: ({ next, connection }) => {
      connection.observables.attach('test', { disconnect })
      next()
    } }
  )
  await api.test()
  currentSocket.close()
  await new Promise(r => setTimeout(r, 10))
  expect(disconnect.mock.calls.length).toBe(1)
})

test("multiple middleware", async () => {
  const api = await setup(
    { echo: text => `${text}.` },
    [
      { echo: ({ next }, text) => next(text + 'h') },
      ({ next }, text) => next(text + 'h')
    ],
    [
      { echo: ({ next }, text) => next(text + 'c') },
      ({ next }, text) => next(text + 'c')
    ]
  )
  const result = await api.echo('test')
  expect(result).toBe('testcchh.')
})

test("context exposes operation", async () => {
  const api = await setup(
    { echo: text => `${text}.` },
    { echo: ({ next, operation }, text) => next(text + operation) },
    { echo: ({ next, data: { operation } }, text) => next(text + operation) }
  )
  const result = await api.echo('test')
  expect(result).toBe('testechoecho.')
})