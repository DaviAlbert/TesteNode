// src/types/express.d.ts

declare global {
    namespace Express {
      interface Request {
        user?: {
          id: string;
          cpf: string;
          role: string;
        };
      }
    }
  }
  