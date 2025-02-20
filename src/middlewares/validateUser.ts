import { Request, Response, NextFunction } from 'express';

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { name, cpf, password, role } = req.body;

  // Validação simples: checar se todos os campos obrigatórios estão presentes
  if (!name || !cpf || !password || !role) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
  }

  // Caso os dados estejam corretos, prossegue para o próximo middleware/rota
  next();
};