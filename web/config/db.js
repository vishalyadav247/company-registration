import mongoose from "mongoose"
import "dotenv/config";

const DB_PATH = process.env.DB_URI;

export const connectDB = async () => {
  try {
    await mongoose.connect(DB_PATH);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

