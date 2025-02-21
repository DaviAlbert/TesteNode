import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import OrderRoutes from './routes/OrderRoutes';

const app = express();
const port = 3333;

app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);
app.use('/orders', OrderRoutes);

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});

export default app;