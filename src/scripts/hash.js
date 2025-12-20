// scripts/hash.js
import bcrypt from "bcrypt";

const hash = await bcrypt.hash("Admin@pixelpulse", 10);
console.log(hash);
