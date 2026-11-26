import mongoose from 'mongoose';

interface InMemoryMongoServer {
  getUri: () => string;
  stop: () => Promise<boolean | void>;
}

let mongoMemoryServer: InMemoryMongoServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      await mongoose.connect(mongoUri);
      console.log(`Connected to MongoDB at ${mongoUri}`);
    } else {
      console.log('No MONGODB_URI found. Initializing in-memory MongoDB...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const serverInstance = await MongoMemoryServer.create();
      mongoMemoryServer = serverInstance;
      const inMemoryUri = serverInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`Connected to in-memory MongoDB at ${inMemoryUri}`);
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};
