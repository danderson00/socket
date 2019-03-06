const hostModule = require('../host')
const consumerModule = require('../consumer')
const WebSocket = require('ws')

let server

const setup = async (...apis) => {
  server = new WebSocket.Server({ port: 1234 })
  const host = hostModule(server, { log: { level: 'fatal' } })
  apis.forEach(api => host.useApi(api))
  return await consumerModule({ socketFactory: () => new WebSocket('ws://localhost:1234') }).connect()
}

afterEach(() => server.close())

test("simple API invocation", async () => {
  const api = await setup({ hello: () => 'world' })
  const result = await api.hello()
  expect(result).toBe('world')
})

test("asynchronous API", async () => {
  const api = await setup({ hello: () => new Promise(res => setTimeout(() => res('world'), 10)) })
  const result = await api.hello()
  expect(result).toBe('world')
})

test("operation parameters", async () => {
  const api = await setup({ hello: (a, d) => a.b + a.c + d })
  const result = await api.hello({ b: 'wor', c: 1 }, 'd')
  expect(result).toBe('wor1d')
})

test("errors result in rejected promises", async () => {
  const api = await setup({ hello: () => { throw new Error('world') } })
  const promise = api.hello()
  await expect(promise).rejects.toEqual({ message: 'world' })
})

test("rejected promises are returned", async () => {
  const api = await setup({ hello: () => Promise.reject(new Error('world'))})
  const promise = api.hello()
  await expect(promise).rejects.toEqual({ message: 'world' })
})

test("multiple APIs", async () => {
  const api = await setup({ hello: () => 'world' }, { echo: value => `'${value}'`})
  expect(await api.hello()).toBe('world')
  expect(await api.echo('test')).toBe("'test'")
})