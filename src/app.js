import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import requestLogger from './middlewares/requestLogger.js'
import notFound from './middlewares/notFound.js'
import errorHandler from './middlewares/errorHandler.js'


//server
const app = express()


//json middleware
app.use(express.json())


//url and form data parser middleware
app.use(express.urlencoded({ extended: true }))


//cors middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}))


//morgan middleware
app.use(morgan('dev'))


//request logger middleware
app.use(requestLogger)


//health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'VibeFeed running 🚀',
        timestamp: new Date().toISOString()
    })
})



//not found middleware
app.use(notFound)


//error handler middleware
app.use(errorHandler)

export default app