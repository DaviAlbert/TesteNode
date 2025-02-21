import {PrismaClient} from "@prisma/client"
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

(async (req, res) => {
    try {
    const { name, cpf, password, email, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10); // Criptografando a senha
  
      const novoUsuario = await prisma.user.create({
        data: {
          name,
          cpf,
          password: hashedPassword,
          email,
          role,
        },
      });
  
      console.log("Usuário criado:", novoUsuario);
      res.status(201).json(novoUsuario);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
    }
  })();

(async()=>{
    const pessoas = await prisma.user.count();
    console.log(pessoas)
})