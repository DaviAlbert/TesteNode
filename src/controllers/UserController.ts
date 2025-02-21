import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserController {
  // Criar usuário (Apenas ADMIN)
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, cpf, password, email, role, userId } = req.body;

      // Verifica se o usuário solicitante é admin
      const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!requestingUser || requestingUser.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem criar usuários.' });
        return;
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário no banco
      const novoUsuario = await prisma.user.create({
        data: { name, cpf, password: hashedPassword, email, role },
      });

      res.status(201).json(novoUsuario);
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }

  // Listar todos os usuários (Apenas ADMIN)
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      // Verifica se o usuário é admin
      const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!requestingUser || requestingUser.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem listar os usuários.' });
        return;
      }

      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  // Buscar usuário por ID (Apenas o próprio usuário ou Admin)
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const id = String(req.params.id);

      // Verifica se o usuário é admin ou se está buscando a si mesmo
      if (userId !== id) {
        const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!requestingUser || requestingUser.role !== 'admin') {
          res.status(403).json({ error: 'Você não tem permissão para acessar esse usuário.' });
          return;
        }
      }

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  }

  // Atualizar usuário (Apenas ADMIN pode alterar role, apenas ADMIN pode alterar senha de outros usuários)
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, name, cpf, password, email, role } = req.body;
      const id = String(req.params.id);

      const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!requestingUser) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      // Apenas Admins podem modificar outros usuários
      if (userId !== id && requestingUser.role !== 'admin') {
        res.status(403).json({ error: 'Você não tem permissão para modificar este usuário.' });
        return;
      }

      // Apenas Admins podem alterar a role
      if (role && requestingUser.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem alterar o papel do usuário.' });
        return;
      }

      // Apenas Admins podem alterar a senha de outros usuários
      let hashedPassword = "";
      if (password) {
        if (userId !== id && requestingUser.role !== 'admin') {
          res.status(403).json({ error: 'Apenas administradores podem alterar a senha de outros usuários.' });
          return;
        }
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { name, cpf, password: hashedPassword, email, role },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }

  // Deletar usuário (Apenas ADMIN)
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const id = String(req.params.id);

      // Verifica se o usuário é admin
      const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!requestingUser || requestingUser.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem deletar usuários.' });
        return;
      }

      await prisma.user.delete({ where: { id } });
      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  }

  // Listar entregas de um usuário (Apenas o próprio usuário pode listar suas entregas)
  static async getUserDeliveries(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const id = String(req.params.id);

      // Verifica se o usuário está tentando acessar suas próprias entregas
      if (userId !== id) {
        res.status(403).json({ error: 'Você não pode acessar as entregas de outro usuário.' });
        return;
      }

      const deliveries = await prisma.order.findMany({
        where: { deliverymanId: id },
      });

      res.json(deliveries);
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao buscar entregas do usuário' });
    }
  }
}
