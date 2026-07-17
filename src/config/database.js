import mongoose from "mongoose";

import { getConfig } from "./env.js";

async function connectDatabase() {
  const { mongoUri } = getConfig();
  mongoose.set("strictQuery", true);
  mongoose.set("sanitizeFilter", true);

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== "production",
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  });
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

export { connectDatabase, disconnectDatabase, databaseIsReady };
