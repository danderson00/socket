module.exports = [{
  synchronous: () => 'world',
  asynchronous: () => new Promise(res => setTimeout(() => res('world'), 10)),
  parameters: (a, d) => a.b + a.c + d,
  error: () => { throw new Error('world') },
  rejection: () => Promise.reject(new Error('world'))
}, {
  multiple: value => `'${value}'`
}]
