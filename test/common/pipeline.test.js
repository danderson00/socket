const pipelineModule = require('../../common/pipeline')

test("arguments are passed through middleware to api", async () => {
  const api = { handler: x => `(${x})` }
  const middleware = [
    { handler: async ({ next, args }) => `${await next(...args)}!`},
    { handler: async ({ next, args }) => `${await next(args[0] + '2')}?`}
  ]
  const pipeline = pipelineModule(api, middleware)
  expect(await pipeline('test')).toBe('(test2)?!')
})

test("initial arguments are passed to next middleware if not supplied", async () => {
  const api = { handler: x => `(${x})` }
  const middleware = [
    { handler: async ({ next }) => `${await next()}!`},
    { handler: async ({ next }) => `${await next()}?`}
  ]
  const pipeline = pipelineModule(api, middleware)
  expect(await pipeline('test')).toBe('(test)?!')
})

test("supplied context is spread onto middleware context", async () => {
  const api = { handler: x => `(${x})` }
  const middleware = [
    { handler: async ({ next, value }) => `${await next()}${value}`}
  ]
  const pipeline = pipelineModule(api, middleware, { value: '!' })
  expect(await pipeline('test')).toBe('(test)!')
})

test("errors in middleware result in rejected promise", async () => {
  const api = { handler: x => `(${x})` }
  const middleware = [
    { handler: async ({ next }) => { throw new Error('test') } }
  ]
  const pipeline = pipelineModule(api, middleware)
  await expect(pipeline('test')).rejects.toMatchObject({ message: 'test' })
})

test("errors in api result in rejected promise", async () => {
  const api = { handler: () => { throw new Error('test') } }
  const middleware = [
    { handler: async ({ next }) => next() }
  ]
  const pipeline = pipelineModule(api, middleware)
  await expect(pipeline('test')).rejects.toMatchObject({ message: 'test' })
})