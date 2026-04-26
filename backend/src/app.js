import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import requestLogger from './middlewares/requestLogger.js'
import notFound from './middlewares/notFound.js'
import errorHandler from './middlewares/errorHandler.js'

// Routes imports
import authRoutes from './routes/auth.route.js'
import userRoutes from './routes/user.routes.js'
import postRoutes from './routes/post.routes.js'
import commentRoutes from './routes/comment.routes.js'
import likeRoutes from './routes/like.routes.js'
import storyRoutes from './routes/story.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import messageRoutes from './routes/message.routes.js'
import uploadRoutes from './routes/upload.routes.js'

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


// ─── API Routes ────────────────────────────────────────
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/posts', postRoutes)
app.use('/api/v1/comments', commentRoutes)
app.use('/api/v1/likes', likeRoutes)
app.use('/api/v1/stories', storyRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/messages', messageRoutes)
app.use('/api/v1/upload', uploadRoutes)


//not found middleware
app.use(notFound)


//error handler middleware
app.use(errorHandler)

export default app