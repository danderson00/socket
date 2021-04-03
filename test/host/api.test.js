const apiModule = require('../../host/api')
const log = require('../../common/logger')()

test("multiple APIs are merged", async () => {
  const api = apiModule(log)
  api.add({ hello: () => 'world' })
  api.add({ echo: text => `'${text}'` })
  expect(await api.get('hello').handler()).toBe('world')
  expect(await api.get('echo').handler('test')).toBe("'test'")
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

test("APIs can be specified as function", async () => {
  const logStub = {}
  const api = apiModule(logStub)
  api.add(({ log }) => {
    expect(log).toBe(logStub)
    return { hello: () => 'world' }
  })
  api.add(() => ({ echo: text => `'${text}'` }))
  expect(await api.get('hello').handler()).toBe('world')
  expect(await api.get('echo').handler('test')).toBe("'test'")
})
