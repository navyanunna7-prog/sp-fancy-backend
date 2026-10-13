const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =========================
// CREATE ORDER
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("AUTH USER ID:", req.userId);

    const {
      customer,
      shippingAddress,
      items,
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod,
    } = req.body;

    if (
      !customer ||
      !shippingAddress ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Incomplete order details",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        message: "User ID missing",
      });
    }

    const order = await Order.create({
      userId: req.userId,

      customer,
      shippingAddress,
      items,
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod: paymentMethod || "cod",
    });

    console.log(
      "Order created for user:",
      req.userId
    );

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});


// =========================
// GET MY ORDERS
// =========================


router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});



// =========================
// GET SINGLE ORDER
// =========================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error(
      "Get order error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
});

module.exports = router;
