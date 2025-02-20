// src/controllers/OrderController.ts
import { Request, Response } from 'express';
import { prisma } from '../prisma'; // Importando o Prisma Client

export class OrderController {

  // Criar um novo pedido
  async createOrder(req: Request, res: Response): Promise<Response> {
    const { address, recipientId, deliverymanId, deliveryPhoto } = req.body;

    try {
      // Verificando se o entregador e o destinatário existem
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });
      const deliveryman = await prisma.user.findUnique({
        where: { id: deliverymanId },
      });

      if (!recipient || !deliveryman) {
        return res.status(404).json({ message: 'Destinatário ou entregador não encontrado' });
      }

      const order = await prisma.order.create({
        data: {
          address,
          recipientId,
          deliverymanId,
          deliveryPhoto,
        },
      });

      return res.status(201).json({ message: 'Pedido criado com sucesso!', order });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao criar pedido' });
    }
  }

  // Listar todos os pedidos
  async getOrders(req: Request, res: Response): Promise<Response> {
    try {
      const orders = await prisma.order.findMany({
        include: {
          recipient: true,   // Inclui os dados do destinatário
          deliveryman: true, // Inclui os dados do entregador
        },
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao listar pedidos' });
    }
  }

  // Atualizar um pedido existente
  async updateOrder(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { address, status, deliveryPhoto } = req.body;

    try {
      const order = await prisma.order.findUnique({
        where: { id: id },
      });

      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: id },
        data: {
          address: address || order.address,
          status: status || order.status,
          deliveryPhoto: deliveryPhoto || order.deliveryPhoto,
        },
      });

      return res.status(200).json({ message: 'Pedido atualizado com sucesso!', updatedOrder });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao atualizar pedido' });
    }
  }

  // Deletar um pedido
  async deleteOrder(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: id },
      });

      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      await prisma.order.delete({
        where: { id: id },
      });

      return res.status(200).json({ message: 'Pedido deletado com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao deletar pedido' });
    }
  }
}