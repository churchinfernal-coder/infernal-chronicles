require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Post = require('./models/Post');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`[${new Date().toISOString()}] Connected to MongoDB`);

    // Seed superadmin user
    let superadmin = await User.findOne({ username: 'root' });
    if (!superadmin) {
      const hash = await bcrypt.hash('supersecurepassword', 12);
      superadmin = new User({ username: 'root', password: hash, role: 'superadmin' });
      await superadmin.save();
      console.log(`[${new Date().toISOString()}] Superadmin user seeded`);
    } else {
      console.log(`[${new Date().toISOString()}] Superadmin user already exists`);
    }

    // Seed sample post
    const post = new Post({ userId: superadmin._id, content: 'Engine seeded successfully.' });
    await post.save();
    console.log(`[${new Date().toISOString()}] Sample post seeded`);

    process.exit(0);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Seeding failed:`, err);
    process.exit(1);
  }
})();
