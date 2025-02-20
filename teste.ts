import {PrismaClient} from "@prisma/client"
const prisma = new PrismaClient();

(async()=>{
    const pessoas = await prisma.pessoa.count();
    console.log(pessoas)
})