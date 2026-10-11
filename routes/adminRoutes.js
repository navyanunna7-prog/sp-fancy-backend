const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const Order = require("../models/Order");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// =========================
// ADMIN LOGIN
// POST /api/admin/login
// =========================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid admin email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid admin email or password",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      message: "Admin login failed",
    });
  }
});

// =========================
// GET ALL ORDERS
// GET /api/admin/orders
// =========================

router.get("/orders", adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error("Admin get orders error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

// =========================
// GET SINGLE ORDER
// GET /api/admin/orders/:id
// =========================

router.get("/orders/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error("Admin get single order error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
});

// =========================
// UPDATE ORDER STATUS
// PUT /api/admin/orders/:id/status
// =========================

router.put(
  "/orders/:id/status",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { orderStatus } = req.body;

      const allowedStatuses = [
        "placed",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!allowedStatuses.includes(orderStatus)) {
        return res.status(400).json({
          message: "Invalid order status",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      order.orderStatus = orderStatus;

      if (
        order.paymentMethod === "cod" &&
        orderStatus === "delivered"
      ) {
        order.paymentStatus = "paid";
      }

      await order.save();

      return res.json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      console.error("Update order status error:", error.message);

      if (error.name === "CastError") {
        return res.status(400).json({
          message: "Invalid order ID",
        });
      }

      return res.status(500).json({
        message: "Failed to update order status",
      });
    }
  }
);

module.exports = router;