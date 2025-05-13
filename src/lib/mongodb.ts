import { MongoClient } from 'mongodb';

// Log environment variables (without sensitive data)
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  hasMongoURI: !!process.env.MONGODB_URI,
  mongoURILength: process.env.MONGODB_URI?.length
});

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@')); // Log URI without credentials

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true, // Allow invalid certificates for development
  tlsAllowInvalidHostnames: true, // Allow invalid hostnames for development
};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    try {
      console.log('Creating new MongoDB client in development mode...');
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect()
        .then(client => {
          console.log('MongoDB connected successfully in development mode');
          return client;
        })
        .catch(error => {
          console.error('MongoDB connection error in development mode:', {
            name: error.name,
            message: error.message,
            code: error.code,
            codeName: error.codeName
          });
          throw error;
        });
    } catch (error) {
      console.error('Error creating MongoDB client in development mode:', error);
      throw error;
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  try {
    console.log('Creating new MongoDB client in production mode...');
    client = new MongoClient(uri, options);
    clientPromise = client.connect()
      .then(client => {
        console.log('MongoDB connected successfully in production mode');
        return client;
      })
      .catch(error => {
        console.error('MongoDB connection error in production mode:', {
          name: error.name,
          message: error.message,
          code: error.code,
          codeName: error.codeName
        });
        throw error;
      });
  } catch (error) {
    console.error('Error creating MongoDB client in production mode:', error);
    throw error;
  }
}

// Add connection status check
clientPromise
  .then(async client => {
    try {
      await client.db().command({ ping: 1 });
      console.log('MongoDB connection status: Connected');
    } catch (error) {
      console.error('MongoDB connection status check failed:', error);
    }
  })
  .catch(error => {
    console.error('MongoDB connection status check failed:', error);
  });

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db();
  return { client, db };
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise; 