import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';

const users = [
  { name: 'Alice Johnson',  email: 'alice@example.com',  password: 'password123', role: 'admin' },
  { name: 'Bob Smith',      email: 'bob@example.com',    password: 'password123' },
  { name: 'Carol White',    email: 'carol@example.com',  password: 'password123' },
  { name: 'David Brown',    email: 'david@example.com',  password: 'password123' },
  { name: 'Eva Martinez',   email: 'eva@example.com',    password: 'password123' },
  { name: 'Frank Lee',      email: 'frank@example.com',  password: 'password123' },
  { name: 'Grace Kim',      email: 'grace@example.com',  password: 'password123' },
  { name: 'Henry Wilson',   email: 'henry@example.com',  password: 'password123' },
  { name: 'Isla Davis',     email: 'isla@example.com',   password: 'password123' },
  { name: 'Jack Taylor',    email: 'jack@example.com',   password: 'password123' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI_USER);
    console.log('Connected to MongoDB (users)');

    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords manually so we can use insertMany (bypasses pre-save hook)
    const hashed = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 12),
      }))
    );

    const inserted = await User.insertMany(hashed);
    console.log(`Seeded ${inserted.length} users`);

    // Print credentials for easy testing
    console.log('\nTest credentials (all passwords: password123):');
    inserted.forEach((u) => console.log(`  ${u.email}  [${u.role}]  id: ${u._id}`));

    return inserted;
  } catch (err) {
    console.error('User seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected\n');
  }
}

seed();
