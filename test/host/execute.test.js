const hostModule = require('../../host')
const WebSocket = require('ws')
const { createServer } = require('http')

const setup = (api, middleware) => {
  const server = new WebSocket.Server({ server: createServer() })
  const host = hostModule({ server, log: { level: 'fatal' } })
    .useApi({ api })
  if(middleware) {
    host.use({ api: middleware })
  }
  return host.execute
}

test("API functions can be executed with returned function", async () => {
  const execute = setup((text1, text2) => text1 + text2)
  expect(await execute('api', ['abc', '123'])).toEqual('abc123')
})

test("middleware is executed with context", async () => {
  const execute = setup(
    (text1, text2) => text1 + text2,
    ({ p1, p2, next }) => next(p1, p2)
  )
  expect(await execute('api', ['abc', '123'], { p1: 'asd', p2: 'qwe' })).toEqual('asdqwe')
})
