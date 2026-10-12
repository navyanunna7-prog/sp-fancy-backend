
const express = require("express");
const Product = require("../models/Product");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// GET all products - public
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Get products error:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// GET single product - public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    console.error("Get product error:", error.message);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// CREATE product - admin only
router.post("/", adminAuthMiddleware, async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error.message);
    res.status(400).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
});

// UPDATE product - admin only
router.put("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error.message);
    res.status(error.name === "CastError" ? 400 : 400).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// DELETE product - admin only
router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error.message);

    res.status(error.name === "CastError" ? 400 : 500).json({
      message: "Failed to delete product",
    });
  }
});

module.exports = router;
