import express, {Application} from 'express';
import metricsRouter from './routes/metrics'

const app: Application = express()

app.use(express.json());

app.use('/metrics', metricsRouter);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

const port: number = Number(process.env.PORT) || 3002;

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

export default app; 