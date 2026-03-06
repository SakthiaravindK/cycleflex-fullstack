const express = require("express");
const User = require("../models/User");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/place", protect, async (req, res) => {
  try {
    const { shipping, paymentMethod = "COD" } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.cart.length) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const totalAmount = user.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      userId: user._id,
      items: user.cart,
      shipping,
      paymentMethod,
      totalAmount
    });

    user.cart = [];
    await user.save();

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to place order." });
  }
});

router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

module.exports = router;