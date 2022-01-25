module.exports = {
  entry: './consumer/index.js',
  output: {
    filename: 'consumer.min.js',
    library: 'xsocket',
    globalObject: 'this'
  }
}
