import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import { connectDB } from './config/db.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import propertyRouter from './routes/property.routes.js';
import inquiryRouter from './routes/inquiry.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';
import contactRouter from './routes/contact.routes.js';
import adminRouter from './routes/admin.routes.js';

const app = express();
const PORT = 5000;

//DB
connectDB();

//MIDLEWARES
app.use(cors());
app.use(express.json());

//ROUTES
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/property', propertyRouter);
app.use('/api/inquiry', inquiryRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
  res.send('API working!');
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
