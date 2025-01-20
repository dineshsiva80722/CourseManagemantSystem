import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import the new route
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import yearRoutes from './routes/yearRoutes.js';
import courseYearMonthBatchRoutes from './routes/courseYearMonthBatchRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dineshsiva693:dineshsiva693@cluster0.uep56.mongodb.net/course_management?retryWrites=true&w=majority&appName=Cluster0';

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('Connected to database:', conn.connection.name);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Try to access the Students collection
    // const studentsCollection = mongoose.connection.db.collection('Students');
    // const count = await studentsCollection.countDocuments();
    // console.log('Number of documents in Students collection:', count);
    
  } catch (err) {
    console.error('❌ MongoDB connection error:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected');
});

// Connect to MongoDB before starting the server
connectDB().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
  });

  // Use routes
  app.use('/api', courseRoutes);
  app.use('/api', studentRoutes);
  app.use('/api', yearRoutes);
  app.use('/api', courseYearMonthBatchRoutes);

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
      message: 'An unexpected error occurred', 
      error: err.message 
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Shutting down server...');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
