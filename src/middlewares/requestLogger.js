const requestLogger = (req, res, next) => {
  req.startTime = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
}

export default requestLogger