const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    sizes: { type: [String], default: ["S", "M", "L", "XL"] },
    image: { type: String, default: "https://via.placeholder.com/500x500?text=CycleFlex" },
    stock: { type: Number, default: 20 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);