// scripts/resetDemo.js
// Usage: npm run demo:reset
import "../config/env.js";
import mongoose from "mongoose";
import { resetDemoData } from "../services/demoData.js";

try {
  await mongoose.connect(process.env.MONGO_URI);
  await resetDemoData();
  console.log("Demo data reset.");
} catch (err) {
  console.error("Demo reset failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
