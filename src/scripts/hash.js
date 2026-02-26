// scripts/hash.js
import bcrypt from "bcryptjs";

const hash = await bcrypt.hash("Admin@pixelpulse", 10);
console.log(hash);
