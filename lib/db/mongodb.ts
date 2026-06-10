import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const globalForMongoose = globalThis as unknown as {
  mongooseCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cache;

function explainMongoConnectError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (/ENOTFOUND|getaddrinfo|EAI_AGAIN/i.test(raw)) {
    return new Error(
      `MongoDB could not resolve the server hostname (${raw}). ` +
        `Copy a fresh connection string from Atlas → Database → Connect → Drivers, paste into .env.local as MONGODB_URI, ` +
        `and confirm the cluster is not paused. Stale hostnames after recreating a cluster cause this.`,
    );
  }
  return err instanceof Error ? err : new Error(raw);
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI).catch((err) => {
      cache.promise = null;
      cache.conn = null;
      throw explainMongoConnectError(err);
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
