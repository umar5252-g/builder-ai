import mongoose from "mongoose";

export async function connectToDatabase() {
  mongoose.connection.on("connected", () => {
    console.log("Successfully connected to mongoDB");
  });
  await mongoose.connect(process.env.MONGODB_URI);
}
