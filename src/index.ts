import express, { Request, Response } from "express"
import cors from "cors"
import roomRouter from "./routes/roomRouter"
import { requireAuth } from "@clerk/express";

const app = express();

app.use(express.json())
app.use(cors({
    credentials: true,
    origin: [
        "http://localhost:3001",
        "https://xcal-fe.vercel.app",
        "https://xcal.codexbuild.website"
    ]
}));


// routes
app.use("/api/room", requireAuth(), roomRouter)
app.get("/health", (req: Request, res: Response) => {
    res.json({ message: "server is healthy" })
})

app.listen(3002, () => { console.log("Server is listening on port 3002") });
