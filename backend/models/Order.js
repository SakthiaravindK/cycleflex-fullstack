const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
    size: { type: String, default: "M" },
    quantity: { type: Number, default: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], default: [] },
    shipping: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    },
    paymentMethod: { type: String, default: "COD" },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Placed", "Packed", "Shipped", "Delivered"], default: "Placed" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);