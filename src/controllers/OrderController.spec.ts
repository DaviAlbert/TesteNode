import request from 'supertest';
import app from '../server'; // Ajuste conforme o caminho do seu app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('OrderController - Testes', () => {
  
  let adminId = '05c1e283-586a-43fb-abce-5674e58e2d92';
  let userId = '123';
  let deliverymanId = '05c1e283-586a-43fb-abce-5674e58e2d92';
  let recipientId = '05c1e283-586a-43fb-abce-5674e58e2d92';
  let orderId = 'order-id';

  // Criar Ordem (somente ADMIN)
  test('Deve criar uma nova ordem se o usuário for admin', async () => {
    const response = await request(app).post('/orders').send({
        adminId: "05c1e283-586a-43fb-abce-5674e58e2d92",
        recipientId: "05c1e283-586a-43fb-abce-5674e58e2d92",
        deliverymanId: "05c1e283-586a-43fb-abce-5674e58e2d92",
        address: "Rua Exemplo, 123, Bairro Centro, Cidade XYZ"
      });

    expect(response.status).toBe(201);
    orderId = response.body.id;
  });

  test('Deve retornar erro ao tentar criar ordem sem ser admin', async () => {
    const response = await request(app).post('/orders').send({
        userId,
        recipientId,
        deliverymanId,
        address: 'Rua Teste, 123',
      });

      expect([403, 404]).toContain(response.status);
  });

  // Listar Ordens
  test('Admin deve conseguir listar todas as ordens', async () => {
    const response = await request(app).get('/orders').send({ userId: '05c1e283-586a-43fb-abce-5674e58e2d92' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('Entregador deve ver apenas suas ordens', async () => {
    const response = await request(app).get('/orders').send({ userId: deliverymanId });

    expect(response.status).toBe(200);
    response.body.forEach((order: any) => {
      expect(order.deliverymanId).toBe(deliverymanId);
    });
  });

  // Buscar Ordem por ID
  test('Admin deve poder buscar uma ordem por ID', async () => {
    const response = await request(app).get(`/orders/${orderId}`).send({ userId: '05c1e283-586a-43fb-abce-5674e58e2d92' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', orderId);
  });

  test('Entregador não pode acessar ordem de outro entregador', async () => {
    const order = await request(app).get('/orders').send({ userId: adminId });
    console.log(order.body.id)
    const response = await request(app).get(`/orders/${order.body.id}`).send({ userId: '123' });

    expect([403, 404, 400]).toContain(response.status);
  });

  // Atualizar Ordem
  test('Admin pode atualizar uma ordem', async () => {
    const response = await request(app).put(`/orders/${orderId}`).send({
        userId: adminId,
        address: 'Rua Nova, 456',
      });

    expect(response.status).toBe(200);
  });

  // Excluir Ordem (somente ADMIN)
  test('Admin pode excluir uma ordem', async () => {
    const response = await request(app).delete(`/orders/${orderId}`).send({ userId: '05c1e283-586a-43fb-abce-5674e58e2d92' });

    console.log(response)
    expect(response.status).toBe(200);
  });

  test('Usuário comum não pode excluir uma ordem', async () => {
    const response = await request(app).delete(`/orders/${orderId}`).send({ userId });

    expect([403, 404]).toContain(response.status);
  });
});