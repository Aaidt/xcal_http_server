import { Router, Request, Response } from "express"
import { prismaClient } from '@repo/db/client';

const roomRouter: Router = Router();

function hashFunction (): string{
    const char = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890"
    let hash = "";
    const length = char.length;
    for(let i = 0; i < length; i ++){
        hash += char[Math.floor(Math.random() * length)]
    }
    return hash
}

roomRouter.post("/create", async function (req: Request, res: Response) {
    const { slug } = req.body;
    const userId = req.userId

    try{
        const room = await prismaClient.room.create({
            data: {
                slug,
                admin: { connect: { id: userId } }
            }
        })

        if(!room){
            res.status(402).json({ message: "Error creaing room" })
            return
        }

        const link = hashFunction();

        const generatedLink = await prismaClient.link.create({
            data:{
                link,
                room: { connect: { id: room.id}}
            }
        })
        if(!generatedLink){ 
            res.status(402).json({ message: "Error saving the link." })
            return
        }

        res.status(200).json({ 
            message: "Room created!",
            roomId: room.id 
        })
    }catch(err){
        console.log("Server error. Could not create room.");
        res.status(500).json({ message: "Server error. Could not create room." })
    }
})

roomRouter.delete("/deleteRoom/:roomId", async function (req: Request<{roomId: string}>, res: Response) {
    const userId = req.userId;
    const { roomId } = req.params;

    try{
        await prismaClient.room.delete({ where: { id: roomId, adminId: userId } })

        res.status(200).json({ message: "room deleted" })
    }catch(err){
        console.log("Server error. Could not delete room.");
        res.status(500).json({ message: "Server error. Could not delete room." })
    }
})

roomRouter.delete("/deleteAll", async function (req: Request, res: Response) {
    const userId = req.userId;

    try{
        await prismaClient.room.deleteMany({ where: { adminId: userId } })

        res.status(200).json({ message: "All rooms deleted"})
    }catch(err){
        console.log("Server error. Could not delete rooms.");
        res.status(500).json({ message: "Server error. Could not delete rooms." })
    }
})

roomRouter.get("/admin", async function (req: Request, res: Response) {
    const userId = req.userId;

    try{
        const rooms = await prismaClient.room.findMany({ 
            where: { adminId: userId },
            select: { 
                id: true,
                link: true,
                created_at: true,
                slug: true
            }
        })

        res.status(200).json({ adminRooms: rooms  })
    }catch(err){
        console.log("Server error. Could not find room.");
        res.status(500).json({ message: "Server error. Could not find room." })
    }
})

roomRouter.get("/visited", async function (req: Request, res: Response) {
    const userId = req.userId;

    try{
        const rooms = await prismaClient.room.findMany({ 
            where: { user: { 
                some: { id: userId } 
            }, NOT: {
                adminId: userId,
            } }
    })

        res.status(200).json({ visitedRooms: rooms })
    }catch(err){
        console.log("Server error. Could not fetch.");
        res.status(500).json({ message: "Server error. Could not fetch." })
    }
})

roomRouter.get("/:slug", async function (req: Request<{slug: string}>, res: Response) {
    const slug = req.params.slug
    const userId = req.userId;

    try{
        const room = await prismaClient.room.findFirst({
            where: { 
                slug, 
                OR: [
                    { adminId: userId },
                    { user: { some: { id: userId } } }
                ]
            },
            select: {
                link: true, 
                id: true 
            }
        })

        if(!room){
            console.log("Could not fetch the room.")
            res.status(403).json({ message: "Could not fetch the room." })
            return 
        }
        res.status(200).json({ 
            roomId: room.id, 
            link: room.link?.link
        })

    }catch(err){
        console.log("Server error. Could not fetch the room.")
        res.status(500).json({ message: "Server error. Could not fetch the room." })
    }
})

roomRouter.post("/shapes/:roomId", async function (req: Request<{roomId: string}>, res: Response){
    const { roomId } = req.params
    const shape = req.body.shape;
    const shapeId = req.body.shapeId
    
    try{
        await prismaClient.shape.upsert({
            where: { id: shapeId },
            create: { 
                shape,
                room: { connect: { id: roomId } }
            },
            update: { shape }
    })
    }catch(err){
        console.log("Server error. could not insert shapes");
        res.status(500).json({ message: "Server error. could not insert shapes" })
    }
})

roomRouter.get("/shapes/:roomId", async function (req: Request<{roomId: string}>, res: Response){
    const { roomId } = req.params

    try{
        const shapes = await prismaClient.shape.findMany({ where: { roomId } })
        res.status(200).json({ shapes })
    }catch(err){
        res.status(500).json({ message: "Server error. could not insert shapes" })
    }
})

roomRouter.get("/join/:link", async function (req:Request<{link:string}>, res: Response){
    const link = req.params.link as string;
    const userId  = req.userId;

    if (!link) {
        return res.status(400).json({ message: "Link param is required" });
    }

    try {
        const linkRecord = await prismaClient.link.findUnique({
            where: { link: link },
            include: { room: { include: { user: true } } },
        });

        if (!linkRecord || !linkRecord.room) {
            return res.status(404).json({ message: "No room found for the given link" });
        }
        const room = linkRecord.room;
        if (room.adminId !== userId && !room.user.some(u => u.id === userId)) {
            await prismaClient.room.update({
                where: { id: room.id },
                data: {
                    user: { connect: { id: userId } }
                }
            });
            console.log(`User ${userId} added as participant to room ${room.id}`);
        }

        if(linkRecord.room.adminId !== userId){
            console.log("You are joining the room: " + linkRecord.room.id);
        }

        res.status(200).json({ roomId: room.id });
    } catch (err) {
        console.error("Server error. Could not fetch the room associated with the link.", err);
        res.status(500).json({ message: "Server error. Could not fetch the room associated with the link." });
    }

})


export default roomRouter