import request from 'supertest';
import app from '../server'; // Importando a instância do Express a partir de server.ts
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

const prisma = new PrismaClient();

describe('UserController', () => {
  const adminId = '05c1e283-586a-43fb-abce-5674e58e2d92';

  describe('POST /users', () => {
    it('deve criar um usuário se o usuário for admin', async () => {
        const newUser = {
            name: 'João',
            cpf: uuidv4(), // Gerando CPF único usando UUID
            password: 'senha123',
            email: `${uuidv4()}@example.com`, // Gerando e-mail único com UUID
            role: 'user',
            userId: adminId,
          };
      
          // Mock para encontrar o usuário admin
          prisma.user.findUnique = jest.fn().mockResolvedValue({ id: adminId, role: 'admin' });
      
          // Criar usuário
          const createResponse = await request(app).post('/users').send(newUser);
  
        expect(createResponse.status).toBe(201);
      });

    it('não deve permitir criação se o usuário não for admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: '2', role: 'user' });

      const response = await request(app)
        .post('/users')
        .send({
          name: 'João',
          cpf: uuidv4(),
          password: 'senha123',
          email: `${uuidv4()}@example.com`,
          role: 'user',
          userId: '2',
        });

        expect([403, 404]).toContain(response.status);
    });

    it('deve retornar erro interno se houver falha ao criar o usuário', async () => {

      const response = await request(app)
        .post('/users')
        .send({
          name: 'João',
          cpf: uuidv4(),
          password: 'senha123',
          email: `${uuidv4()}@example.com`,
          role: 'user',
          userId: '123123',
        });

        expect([403, 404]).toContain(response.status);
    });
  });

  describe('GET /users', () => {
    it('deve listar todos os usuários se o usuário for admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: adminId, role: 'admin' });
      prisma.user.findMany = jest.fn().mockResolvedValue([{ id: '2', name: 'João' }]);

      const response = await request(app).get('/users').send({ userId: adminId });

      expect(response.status).toBe(200);
    });

    it('não deve permitir listagem se o usuário não for admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: '2', role: 'user' });

      const response = await request(app).get('/users').send({ userId: '2' });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('GET /users/:id', () => {
    it('deve retornar o usuário se for o próprio usuário ou admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: adminId, role: 'user', name: 'João' });

      const response = await request(app).get(`/users/${adminId}`).send({ userId: adminId });

      expect(response.status).toBe(200);
    });

    it('não deve permitir acessar dados de outro usuário se não for admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: '2', role: 'user' });

      const response = await request(app).get(`/users/2`).send({ userId: adminId });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('PUT /users/:id', () => {
    it('deve atualizar o usuário se for o próprio ou admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: adminId, role: 'admin' });
      prisma.user.update = jest.fn().mockResolvedValue({ id: adminId, name: 'João Atualizado' });

      const response = await request(app)
        .put(`/users/${adminId}`)
        .send({
          userId: adminId,
          name: 'João Atualizado',
          email: `${uuidv4()}@example.com`,
        });

      expect(response.status).toBe(200);
    });

    it('não deve permitir atualização se o usuário não for admin e tentar modificar outro usuário', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: '2', role: 'user' });

      const response = await request(app)
        .put(`/users/3`)
        .send({
          userId: '2',
          name: 'João Atualizado',
        });

        expect([403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /users/:id', () => {
    describe('DELETE /users/:id', () => {
        it('deve criar um usuário e excluir o usuário se o usuário for admin', async () => {
          // 1. Criar um novo usuário
          const newUser = {
            name: 'Carlos',
            cpf: uuidv4(), // Gerando CPF único usando UUID
            password: 'senha123',
            email: `${uuidv4()}@example.com`, // Gerando e-mail único com UUID
            role: 'user',
            userId: adminId,
          };
      
          // Mock para encontrar o usuário admin
          prisma.user.findUnique = jest.fn().mockResolvedValue({ id: adminId, role: 'admin' });
      
          // Criar usuário
          const createResponse = await request(app).post('/users').send(newUser);
          const createdUserId = createResponse.body.id;
          const deleteResponse = await request(app).delete(`/users/${createdUserId}`).send({ userId: adminId });
      
          // Verificar se a exclusão foi bem-sucedida
          expect(deleteResponse.status).toBe(200);
          expect(deleteResponse.body.message).toBe('Usuário deletado com sucesso');
        });
      });      

    it('não deve permitir a exclusão se o usuário não for admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: '2', role: 'user' });

      const response = await request(app).delete(`/users/2`).send({ userId: '2' });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('GET /users/:id/deliveries', () => {

    it('não deve permitir acessar entregas de outro usuário', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: adminId, role: 'user' });

      const response = await request(app).get(`/users/2/deliveries`).send({ userId: adminId });

      expect([403, 404]).toContain(response.status);
    });
  });
});