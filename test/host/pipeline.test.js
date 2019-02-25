const pipelineModule = require('../../host/pipeline')
const apiModule = require('../../host/api')
const middlewareModule = require('../../host/middleware')
const log = require('../../host/logger')()

let api, middleware, pipeline

beforeEach(() => {
  api = apiModule(log)
  middleware = middlewareModule(log)
  pipeline = pipelineModule(api, middleware)
})

test("pipeline executes corresponding middleware and API operation", async () => {
  api.add({
    hello: () => 'world',
    echo: (text1, text2) => `${text1}${text2}`
  })
  middleware.add({
    echo: (text1, text2) => [`(${text1})`, `[${text2}]`]
  })
  middleware.add({
    hello: () => { throw new Error("Shouldn't be executed") },
    echo: (text1, text2) => [text2, text1]
  })

  const result = await pipeline.execute('echo', ['t1', 't2'])
  expect(result).toBe('[t2](t1)')
})

test("pipeline handles asynchronous operations", async () => {
  api.add({ echo: text => Promise.resolve(`'${text}'`) })
  middleware.add({ echo: text => Promise.resolve([`"${text}"`]) })

  const result = await pipeline.execute('echo', ['test'])
  expect(result).toBe(`'"test"'`)
})

test("pipeline normalizes non-array result from middleware", async () => {
  api.add({ echo: text => text })
  middleware.add({ echo: text => `"${text}"` })
  middleware.add({ echo: text => `'${text}'` })

  const result = await pipeline.execute('echo', ['test'])
  expect(result).toBe(`'"test"'`)
})

test("pipeline normalizes non-array promise result from middleware", async () => {
  api.add({ echo: text => text })
  middleware.add({ echo: text => Promise.resolve(`"${text}"`) })
  middleware.add({ echo: text => Promise.resolve(`'${text}'`) })

  const result = await pipeline.execute('echo', ['test'])
  expect(result).toBe(`'"test"'`)
})

test("pipeline relays errors from middleware", async () => {
  api.add({ hello: () => 'world' })
  middleware.add({ hello: () => { throw new Error("test") } })
  await expect(pipeline.execute('hello', [])).rejects.toMatchObject({ message: 'test' })
})