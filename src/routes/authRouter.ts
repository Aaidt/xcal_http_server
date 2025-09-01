import { Router, Request, Response } from "express";
import { prismaClient } from "../prisma/export";
import { compare, hash } from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import authMiddleware from "../authMiddleware";
dotenv.config()

const authRouter: Router = Router();
const jwt_secret = process.env.jwt_secret as string;

authRouter.post("/signup", async function(req: Request, res: Response) {
  const { name, username, password } = req.body;

  const hashedPassword = await hash(password, 6);

  try {
    const user = await prismaClient.user.create({
      data: {
        name,
        username,
        password: hashedPassword
      }
    })

    if (!user) {
      console.log("Failed to create the user")
      res.status(402).json({ message: "Failed to create the user" })
      return
    }

    const token = jwt.sign({ userId: user.id }, jwt_secret);

    res.status(200).json({ message: "User created successfully.", userId: user.id, token })

  } catch (err) {
    console.log("Server error.")
    res.status(500).json({ message: "Server error. Could not sign the user in." })
  }
})

authRouter.post("/signin", async function(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    const user = await prismaClient.user.findFirst({ where: { username } })

    if (!user) {
      console.log("User not found.");
      res.status(404).json({ message: "User not found." })
      return
    }

    if (!(await compare(password, user.password))) {
      console.log("Incorrect password")
      res.status(403).json({ message: "Incorrect credentials" })
      return
    }

    const token = jwt.sign({ userId: user?.id }, jwt_secret);

    res.status(200).json({
      message: "signed in.",
      userId: user.id,
      token
    })

  } catch (err) {
    console.log("Server error.")
    res.status(500).json({ message: "Server error. Could not sign the user in." })
  }
})

authRouter.get("/me", authMiddleware, async function(req: Request, res: Response) {
  const userId = req.userId;
  try {
    const user = await prismaClient.user.findFirst({
      where: { id: userId },
      select: {
        username: true,
        name: true,
        photo: true
      }
    });
    res.status(200).json({ user })

  } catch (err) { console.error(err) }
})

export default authRouter   
