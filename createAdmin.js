const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("./models/Admin");

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const hashedPassword = await bcrypt.hash(
      "navya2507",
      10
    );

    const admin = await Admin.findOneAndUpdate(
      { email: "admin@spfancy.com" },
      {
        name: "SP FANCY Admin",
        email: "navyanunna7@gmail.com",
        password: hashedPassword,
        role: "admin",
      },
      {
        new: true,
      }
    );

    if (!admin) {
      console.log("Existing admin not found");
      process.exit(1);
    }

    console.log("Admin credentials updated successfully");
    console.log("Email:", admin.email);

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "Admin update error:",
      error.message
    );

    process.exit(1);
  }
}

updateAdmin();