import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../.env") });

async function cleanupDuplicates() {
    try {
        console.log("🔍 Connecting to database...");
        
        if (!process.env.MONGODB_URI) {
            console.error("❌ MONGODB_URI not found in .env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to database");

        // Find duplicate emails
        const duplicates = await User.aggregate([
            {
                $group: {
                    _id: "$email",
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        if (duplicates.length === 0) {
            console.log("✅ No duplicate emails found");
        } else {
            console.log(`⚠️  Found ${duplicates.length} emails with duplicates:`);
            
            for (const dup of duplicates) {
                console.log(`\n📧 Email: ${dup._id}`);
                console.log(`   Count: ${dup.count}`);
                console.log(`   IDs: ${dup.ids}`);
                
                // Keep the first one, delete the rest
                const idsToDelete = dup.ids.slice(1);
                const deleted = await User.deleteMany({ _id: { $in: idsToDelete } });
                console.log(`   ✅ Deleted ${deleted.deletedCount} duplicate(s)`);
            }
        }

        // Drop and recreate indexes to ensure they're clean
        console.log("\n🔧 Rebuilding indexes...");
        await User.collection.dropIndexes();
        await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
        console.log("✅ Indexes rebuilt successfully (email only)");

        console.log("\n✨ Cleanup complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

cleanupDuplicates();
