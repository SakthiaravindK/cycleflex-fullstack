const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Product = require("./models/Product");

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany({});
    await Product.deleteMany({});

    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const userPassword = await bcrypt.hash("Cycleflex@123", 10);

    await User.create({
      name: "CycleFlex Admin",
      email: "admin@cycleflex.com",
      password: adminPassword,
      role: "admin"
    });

    await User.create({
      name: "CycleFlex Customer",
      email: "customer@cycleflex.com",
      password: userPassword,
      role: "user"
    });

    await Product.insertMany([
      {
        title: "Women Pro Cycle Shorts",
        category: "Women",
        description: "High-waist compression fit. Breathable and squat-proof fabric.",
        price: 799,
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Women Seamless Bike Shorts",
        category: "Women",
        description: "Ultra-soft stretch for training and long rides.",
        price: 699,
        image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Men Endurance Cycle Shorts",
        category: "Men",
        description: "Long-ride comfort with sweat-wicking performance fabric.",
        price: 899,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Men Aero Compression Shorts",
        category: "Men",
        description: "Performance fit with lightweight stretch and support.",
        price: 999,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
      }
    ]);

    console.log("Seed completed successfully");
    console.log("Admin login: admin@cycleflex.com / Admin@123");
    console.log("Customer login: customer@cycleflex.com / Cycleflex@123");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();