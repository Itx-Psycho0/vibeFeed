import dotenv from "dotenv";
dotenv.config();
import connectDB from "./src/config/db.js";
import app from "./src/app.js"

const port = process.env.PORT || 8000;


const createServer = async () => {
    try{
        //database connection
        await connectDB();

        //server
        const server = app.listen(port, () => {
            console.log(`
          ╔══════════════════════════════════════╗
          ║   VibeFeed Server Running            ║
          ║   http://localhost:${port}              ║
          ║   Environment: ${process.env.NODE_ENV}           ║
          ╚══════════════════════════════════════╝
          `)
        })

        // graceful shutdown        
        process.on("unhandledRejection", (err) => {
            console.log("unhandled rejection", err)
            server.close(() => process.exit(1))
        })

        process.on('SIGTERM', () => {
        server.close(() => process.exit(0))
        })
    }
    catch(err){
        console.log("error", err.message)
        process.exit(1)
    }
}

createServer();

