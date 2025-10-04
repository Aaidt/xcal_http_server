import "dotenv/config"
import express, { Request, Response } from "express"
import cors from "cors"
import roomRouter from "./routes/roomRouter"
import { requireAuth } from "@clerk/express";
import { prismaClient } from "./prisma/export";


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
app.get("/api/me", requireAuth(), async function (req: Request, res: Response) {
   const userId = req.auth?.userId
   if (!userId) {
      res.status(404).json({ message: "No userId recieved." })
      return
   }

   try {
      const userAlreadyExists = await prismaClient.user.findUnique({
         where: { id: userId }
      });

      if (!userAlreadyExists) {
         await prismaClient.user.create({
            data: { id: userId }
         })

         res.status(200).json({ message: "User is now in the db." })
      } else {
         res.status(200).json({ message: "User is already in the db" })
      }


   } catch (err) {
      console.log("Server error: ", err);
      res.status(500).json({ message: "Server error " + err });
   }
})
app.use("/api/room", requireAuth(), roomRouter)
app.get("/health", (req: Request, res: Response) => {
   res.json({ message: "server is healthy" })
})

app.listen(3002, () => { console.log("Server is listening on port 3002") });


