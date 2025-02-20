import express, { Request, Response } from 'express';
import { UserController } from './controllers/UserController';

const app = express();
const port = 3000;

// Middleware para parse de JSON
app.use(express.json());

// Rota para criar um usuário
app.post('/user', UserController.createUser);

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});