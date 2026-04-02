const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}

export default errorHandler