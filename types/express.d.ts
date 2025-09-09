
import "@clerk/express";

declare module "express-serve-static-core" {
    interface Request {
        auth?: import("@clerk/express").AuthObject;
    }
}
