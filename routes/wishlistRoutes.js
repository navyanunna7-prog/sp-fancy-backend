
const express = require("express");
const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const customerAuth = require("../middleware/customerAuth");

const router = express.Router();

router.use(customerAuth);

// GET: logged-in customer's wishlist
router.get("/", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      userId: req.userId,
    });

    res.json(wishlist || { items: [] });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ message: "Failed to load wishlist" });
  }
});

// POST: add a product
router.post("/", async (req, res) => {
  try {
    const { product } = req.body;

    if (!product || !(product._id || product.id)) {
      return res.status(400).json({
        message: "A valid product is required",
      });
    }

    const productId = String(product._id || product.id);
    const price = Number(product.price);

    if (!product.name || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        message: "Product name and valid price are required",
      });
    }

    const item = {
      productId,
      name: product.name,
      image: product.image || product.images?.[0] || "",
      price,
      category: product.category || "",
    };

    let wishlist = await Wishlist.findOne({
      userId: req.userId,
    });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.userId,
        items: [],
      });
    }

    const alreadyExists = wishlist.items.some(
      (entry) => entry.productId === productId
    );

    if (!alreadyExists) {
      wishlist.items.push(item);
      await wishlist.save();
    }

    res.json(wishlist);
  } catch (error) {
    console.error("Add wishlist error:", error);
    res.status(500).json({ message: "Failed to add product" });
  }
});

// DELETE: remove a product
router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.userId },
      { $pull: { items: { productId } } },
      { new: true }
    );

    res.json(wishlist || { items: [] });
  } catch (error) {
    console.error("Remove wishlist error:", error);
    res.status(500).json({ message: "Failed to remove product" });
  }
});

module.exports = router;
