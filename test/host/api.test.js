const apiModule = require('../../host/api')
const log = require('../../host/logger')()

test("multiple APIs are merged", async () => {
  const api = apiModule(log)
  api.add({ hello: () => 'world' })
  api.add({ echo: text => `'${text}'` })
  expect(await api.execute('hello')).toBe('world')
  expect(await api.execute('echo', ['test'])).toBe("'test'")
})

test("operations returns API metadata", () => {
  const api = apiModule(log)
  api.add({ 
    hello: () => 'world',
    echo: text => `'${text}'`
  })
  expect(api.operations()).toEqual([
    { name: 'hello' },
    { name: 'echo' }
  ])
})