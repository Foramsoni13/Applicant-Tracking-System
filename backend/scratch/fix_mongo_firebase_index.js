import "dotenv/config";
import mongoose from "mongoose";

async function fixMongoFirebaseIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ATS";
    console.log("Connecting to MongoDB ATS database at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    const db = mongoose.connection.db;

    // Collections to clean up
    const collectionsToClean = ["users", "hr", "candidates"];

    for (const collName of collectionsToClean) {
      try {
        const collection = db.collection(collName);
        const indexes = await collection.indexes();
        console.log(`\nIndexes for collection [${collName}]:`, indexes.map((i) => i.name));

        const hasFirebaseIndex = indexes.some((i) => i.name === "firebaseUid_1");
        if (hasFirebaseIndex) {
          console.log(`⚠️ Dropping [firebaseUid_1] index from [${collName}]...`);
          await collection.dropIndex("firebaseUid_1");
          console.log(`✅ Dropped [firebaseUid_1] index from [${collName}]`);
        } else {
          console.log(`ℹ️ Index [firebaseUid_1] not found in [${collName}]`);
        }

        // Unset firebaseUid from all documents
        const updateResult = await collection.updateMany(
          { firebaseUid: { $exists: true } },
          { $unset: { firebaseUid: "" } }
        );
        console.log(`✅ Unset firebaseUid on ${updateResult.modifiedCount} documents in [${collName}]`);

        // Print updated indexes
        const updatedIndexes = await collection.indexes();
        console.log(`Updated Indexes for [${collName}]:`, updatedIndexes.map((i) => i.name));

      } catch (err) {
        console.warn(`Warning processing collection [${collName}]:`, err.message);
      }
    }

    console.log("\n✅ MongoDB Firebase Index & Field Cleanup Complete!");
  } catch (error) {
    console.error("❌ Cleanup Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixMongoFirebaseIndex();
