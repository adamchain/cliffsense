import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const globalForMongoose = globalThis as unknown as {
  mongooseCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
