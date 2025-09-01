import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();

const jwt_secret = process.env.JWT_SECRET as string;

declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

export default function authMiddleware (req: Request, res: Response, next: NextFunction) {
    const header = req.headers["authorization"] || "";
    const verified = jwt.verify(header, jwt_secret) as jwt.JwtPayload;

    if(verified){
        req.userId = verified.userId;
        next();
    }else{
        throw new Error("Not authorized.");
    }
}