const middlewareModule = require('../../common/middleware')
const log = require('../../common/logger')()

test("middleware is added for each operation", () => {
  const middleware = middlewareModule(log)
  const handler = () => {}
  middleware.add({
    o1: handler,
    o2: handler
  })
  middleware.add({
    o2: handler,
    o3: handler
  })
  expect(middleware.get('o1')).toEqual([{ name: 'o1', handler }])
  expect(middleware.get('o2')).toEqual([{ name: 'o2', handler }, { name: 'o2', handler }])
  expect(middleware.get('o3')).toEqual([{ name: 'o3', handler }])
})

test("global middleware is added in order", () => {
  const middleware = middlewareModule(log)
  const handler = () => {}
  middleware.add({ o1: handler })  
  middleware.add(handler)  
  middleware.add({ o2: handler })  
  expect(middleware.get('o1')).toEqual([{ name: 'o1', handler }, { name: null, handler }])
  expect(middleware.get('o2')).toEqual([{ name: null, handler }, { name: 'o2', handler }])
})