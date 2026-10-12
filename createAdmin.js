
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "your-admin-email@example.com";
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      throw new Error("ADMIN_PASSWORD is missing");
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name: "Store Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully.");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
