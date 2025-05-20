const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

const uri = "mongodb://admin:password@cluster0.xxxxxx.mongodb.net/user-account?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.use(express.json());
app.use(express.static(__dirname));

let collection;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    const db = client.db("user-account");
    collection = db.collection("users");
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err);
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/get-profile', async (req, res) => {
  try {
    console.log("➡️  GET /get-profile called");
    const user = await collection.findOne({});
    if (!user) {
      console.log("⚠️  No user found in database");
      return res.status(404).json({ error: "No user found" });
    }
    const { _id, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error("❌ Error in GET /get-profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/update-profile', async (req, res) => {
  try {
    console.log("➡️  POST /update-profile called with body:", req.body);
    const { name, email, interests } = req.body;

    if (!name || !email || !interests) {
      console.log("⚠️  Missing required fields in request body");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await collection.updateOne({}, { $set: { name, email, interests } });

    console.log("✅ Update result:", result);

    if (result.matchedCount === 0) {
      console.log("⚠️  No user found to update");
      return res.status(404).json({ error: "No user found to update" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("❌ Error in POST /update-profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, async () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  await connectDB();
});

// 🔴 Graceful Shutdown
process.on('SIGINT', async () => {
  console.log("\n🛑 Gracefully shutting down...");
  try {
    await client.close();
    console.log("✅ MongoDB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
});
