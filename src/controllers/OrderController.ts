import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderController {

  // Criar ordem (somente ADMIN)
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { address, recipientId, deliverymanId, userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId é necessário.' });
        return;
      }

      // Verifica se o usuário solicitante é admin
      const userRole = await prisma.user.findUnique({ where: { id: userId } });
      if (!userRole) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }
      
      if (userRole.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem criar pedidos.' });
        return;
      }

      // Verifica se o recipientId existe
      const recipientExists = await prisma.user.findUnique({ where: { id: recipientId } });
      if (!recipientExists) {
        res.status(404).json({ error: 'Destinatário não encontrado.' });
        return;
      }

      // Verifica se o deliverymanId existe
      const deliverymanExists = await prisma.user.findUnique({ where: { id: deliverymanId } });
      if (!deliverymanExists) {
        res.status(404).json({ error: 'Entregador não encontrado.' });
        return;
      }

      // Criar ordem no banco
      const novaOrdem = await prisma.order.create({
        data: { address, recipientId, deliverymanId },
      });

      res.status(201).json(novaOrdem);
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao criar ordem' });
    }
  }

  // Listar todas as encomendas (admins vêem todas, entregadores só as próprias)
  static async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId é necessário.' });
        return;
      }

      // Verifica o papel do usuário
      const userRole = await prisma.user.findUnique({ where: { id: userId } });
      if (!userRole) {
        res.status(403).json({ error: 'Usuário não encontrado.' });
        return;
      }

      let orders;
      if (userRole.role === 'admin') {
        orders = await prisma.order.findMany();
      } else if (userRole.role === 'deliverer') {
        orders = await prisma.order.findMany({ where: { deliverymanId: userId } });
      } else {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }

      res.status(200).json(orders);
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao buscar ordens' });
    }
  }

  // Buscar ordem por ID (entregador só pode ver suas próprias encomendas)
  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body; // userId vem do corpo da requisição (req.body)
      const id = req.params.id; // ID da ordem vem da URL (req.params.id)
      
      if (!userId) {
        res.status(400).json({ error: 'userId é necessário.' });
        return;
      }

      // Verifica o papel do usuário
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        res.status(403).json({ error: 'Usuário não encontrado.' });
        return;
      }

      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ error: 'Ordem não encontrada.' });
        return;
      }
      // Verifica se o usuário tem permissão para acessar a ordem
      if (user.role !== 'admin' && order.deliverymanId !== userId) {
        res.status(403).json({ error: 'Você não tem permissão para acessar esta ordem.' });
        return;
      }

      res.status(200).json(order);      
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: 'Erro ao buscar ordem' });
    }
  }

  // Atualizar ordem (somente ADMIN ou entregador que retirou)
  static async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { address, status, deliveryPhoto, recipientId, deliverymanId, userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId é necessário.' });
        return;
      }

      // Verifica o papel do usuário
      const userRole = await prisma.user.findUnique({ where: { id: userId } });
      if (!userRole) {
        res.status(403).json({ error: 'Usuário não encontrado.' });
        return;
      }

      const existingOrder = await prisma.order.findUnique({ where: { id } });
      if (!existingOrder) {
        res.status(404).json({ error: 'Ordem não encontrada.' });
        return;
      }
      if (userRole.role !== 'admin' && existingOrder.deliverymanId !== userId) {
        res.status(403).json({ error: 'Você não pode atualizar esta ordem.' });
        return;
      }

      // Se estiver marcando como entregue, exige foto
      if (status === 'entregue' && !deliveryPhoto) {
        res.status(400).json({ error: 'É obrigatório enviar uma foto para marcar como entregue.' });
        return;
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { address, status, deliveryPhoto, recipientId, deliverymanId },
      });

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: `Erro ao atualizar ordem ${error}` });
    }
  }

  // Marcar ordem como devolvida (somente entregador que retirou)
  static async returnOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId é necessário.' });
        return;
      }

      const userRole = await prisma.user.findUnique({ where: { id: userId } });
      if (!userRole) {
        res.status(403).json({ error: 'Usuário não encontrado.' });
        return;
      }

      const existingOrder = await prisma.order.findUnique({ where: { id } });

      if (!existingOrder) {
        res.status(404).json({ error: 'Ordem não encontrada.' });
        return;
      }
      if (userRole.role !== 'deliverer' || existingOrder.deliverymanId !== userId) {
        res.status(403).json({ error: 'Você não pode devolver esta ordem.' });
        return;
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: 'devolvida' },
      });

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: `Erro ao devolver ordem ${error}` });
    }
  }

  // Excluir pedido (somente ADMIN)
  static async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const id = String(req.params.id);

      if (!userId) {
        res.status(400).json({ error: 'userId é necessário.' });
        return;
      }

      // Verifica o papel do usuário
      const userRole = await prisma.user.findUnique({ where: { id: userId } });
      if (userRole?.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem excluir pedidos.' });
        return;
      }

      const existingOrder = await prisma.order.findUnique({ where: { id } });
      if (!existingOrder) {
        res.status(404).json({ error: 'Ordem não encontrada.' });
        return;
      }

      await prisma.order.delete({ where: { id } });

      res.json({ message: 'Ordem deletada com sucesso' });
    } catch (error) {
      console.error(`Erro: ${error}`);
      res.status(500).json({ error: `Erro ao deletar ordem: ${error}` });
    }
  }
}