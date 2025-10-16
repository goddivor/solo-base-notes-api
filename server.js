import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

await server.start();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Auth routes (Google OAuth)
app.use('/auth', authRoutes);

// GraphQL endpoint
app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      return await authenticateToken(req);
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Solo Base Notes API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/auth/google`);
});
