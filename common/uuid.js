module.exports = () => {
  const url = URL.createObjectURL(new Blob())
  URL.revokeObjectURL(url)
  return url.substring(url.length - 36)
}