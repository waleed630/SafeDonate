import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../.env") });

async function dropUsernameIndex() {
    try {
        console.log("🔍 Connecting to database...");
        
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI not found in .env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to database");

        const db = mongoose.connection.db;
        const collection = db.collection("users");

        // Get all indexes
        const indexes = await collection.listIndexes().toArray();
        console.log("\n📋 Current indexes:");
        indexes.forEach((index) => {
            console.log(`   - ${index.name}:`, index.key);
        });

        // Drop username index if it exists
        const hasUsernameIndex = indexes.find(idx => idx.name === "username_1");
        if (hasUsernameIndex) {
            console.log("\n⚠️  Found username_1 index, dropping it...");
            await collection.dropIndex("username_1");
            console.log("✅ username_1 index dropped successfully");
        } else {
            console.log("\n✅ username_1 index doesn't exist, no action needed");
        }

        // Verify remaining indexes
        const newIndexes = await collection.listIndexes().toArray();
        console.log("\n📋 Indexes after cleanup:");
        newIndexes.forEach((index) => {
            console.log(`   - ${index.name}:`, index.key);
        });

        console.log("\n✨ Cleanup complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

dropUsernameIndex();
