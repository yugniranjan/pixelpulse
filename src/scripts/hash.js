// scripts/hash.js
import bcrypt from "bcryptjs";

const hash = await bcrypt.hash("", 10);
console.log(hash);
