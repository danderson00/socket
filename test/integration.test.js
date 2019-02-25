const host = require('../host')
const consumer = require('../consumer')
const WebSocket = require('ws')

let server

const setup = async api => {
  server = new WebSocket.Server({ port: 1234 })
  host(server).useApi(api)
  return await consumer(new WebSocket('ws://localhost:1234'))
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