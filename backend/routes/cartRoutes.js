const express = require("express");
const Product = require("../models/Product");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.cart || []);
});

router.post("/add", protect, async (req, res) => {
  try {
    const { productId, size = "M", quantity = 1 } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const user = await User.findById(req.user._id);
    const existingIndex = user.cart.findIndex(
      (item) => String(item.productId) === String(productId) && item.size === size
    );

    if (existingIndex >= 0) {
      user.cart[existingIndex].quantity += Number(quantity);
    } else {
      user.cart.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.image,
        size,
        quantity: Number(quantity)
      });
    }

    await user.save();
    res.json({ message: "Added to cart.", cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: "Failed to add item to cart." });
  }
});

router.post("/remove", protect, async (req, res) => {
  try {
    const { productId, size } = req.body;
    const user = await User.findById(req.user._id);

    user.cart = user.cart.filter(
      (item) => !(String(item.productId) === String(productId) && item.size === size)
    );

    await user.save();
    res.json({ message: "Removed from cart.", cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove item." });
  }
});

router.post("/clear", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    res.json({ message: "Cart cleared." });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear cart." });
  }
});

module.exports = router;