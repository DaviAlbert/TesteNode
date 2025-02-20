import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

export class AuthController {
  // Rota de login
  async login(req: Request, res: Response): Promise<Response> {
    const { cpf, password } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { cpf },
      });

      if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Senha inválida' });
      }

      const token = jwt.sign(
        { id: user.id, cpf: user.cpf, role: user.role },
        'secreto',
        { expiresIn: '1h' }
      );

      return res.status(200).json({ message: 'Login bem-sucedido', token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao realizar login' });
    }
  }

  // Middleware para verificar o token JWT
  static authenticateToken(req: Request, res: Response, next: Function) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: 'Token não fornecido' });
    }

    jwt.verify(token, 'secreto', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido' });
      }

      req.user = user as { id: string; cpf: string; role: string }; // Adiciona o usuário ao `req`
      next();
    });
  }
}