import express, { Request, Response } from "express"
import cors from "cors"
// import cookieParser from "cookie-parser"  
import authRouter from "./routes/authRouter"
import roomRouter from "./routes/roomRouter"
import authMiddleware from "./authMiddleware"

const app = express();

app.use(express.json())
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:3001"
}));
// app.use(cookieParser())


// routes
app.use("/api/auth", authRouter);
app.use("/api/room", authMiddleware, roomRouter)

app.listen(3000, () => { console.log("Server is listening on port 3000") });