import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserController {
  static async createUser(req: Request, res: Response): Promise<void> {
    const user = await prisma.user.count();
    console.log(user)
  }
}