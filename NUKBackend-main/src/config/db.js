const mongoose = require("mongoose");

async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  const databaseName = mongoose.connection.name || "configured database";
  console.log(`MongoDB connected to database: ${databaseName}`);
}

module.exports = connectDB;
