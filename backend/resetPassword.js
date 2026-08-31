require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const EMAIL = "testuser123@example.com";

// Change this to your new password
const NEW_PASSWORD = "ganesh@123";

async function resetPassword() {
  try {
    // Use the SAME environment variable as server.js
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    // Find the existing user
    const user = await User.findOne({ email: EMAIL });

    if (!user) {
      console.log("User not found:", EMAIL);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log("User found:", user.email);
    console.log("User ID:", user._id.toString());

    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Update ONLY the password
    user.password = hashedPassword;

    await user.save();

    console.log("----------------------------------------");
    console.log("Password reset successfully!");
    console.log("Email:", EMAIL);
    console.log("New password:", NEW_PASSWORD);
    console.log("User ID preserved:", user._id.toString());
    console.log("----------------------------------------");

    await mongoose.disconnect();

    process.exit(0);

  } catch (error) {
    console.error("Password reset failed:");
    console.error(error);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect error
    }

    process.exit(1);
  }
}

resetPassword();