const orderService = require("../services/OrderService");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Promotion = require("../models/Promotion")
const Employee = require("../models/Employee");

const createOrder = async (req, res) => {
  try {
    const {
      customerID,
      products,
      totalAmount,
      paymentMethod,
      shippingAddress,
      notes,
      promotionID  // Add this line to get promotionID from the request
    } = req.body;

    if (
      !customerID ||
      !products ||
      products.length === 0 ||
      !totalAmount ||
      !paymentMethod ||
      !shippingAddress
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ" });
    }

    // Create order object
    const newOrder = new Order({
      orderID: `ORD-${Date.now()}`,
      customerID,
      products,
      totalAmount,
      paymentMethod,
      shippingAddress,
      notes,
    });

    // If there's a promotion ID, add it to the order
    if (promotionID) {
      newOrder.promotionID = promotionID;
    }

    await newOrder.save();
    res.json({
      success: true,
      message: "Đơn hàng đã được tạo thành công!",
      order: newOrder,
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo đơn hàng" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    console.log("✅ Lấy danh sách đơn hàng:", orders);
    res.render("dashboard/orders", { orders, page: "orders" });
  } catch (error) {
    console.error("🔥 Lỗi server khi lấy danh sách đơn hàng:", error);
    res
      .status(500)
      .json({ message: "Lỗi máy chủ nội bộ!", error: error.message });
  }
};
const renderOrdersPage = async (req, res) => {
  try {
    const orders = await getAllOrders(); // Lấy danh sách đơn hàng

    if (!orders || orders.length === 0) {
      return res.render("orders", { orders: [] }); // Nếu không có dữ liệu, gửi mảng rỗng để tránh lỗi
    }

    res.render("orders", { orders });
  } catch (error) {
    res.status(500).send("Lỗi server: " + error.message);
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const updatedOrder = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
    );
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    await orderService.deleteOrder(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const createOrderScreen = async (req, res) => {
  try {
    const customers = await Customer.find();
    const products = await Product.find();
    const promotions = await Promotion.find(); // Add this line to fetch promotions
    
    console.log("📌 Customers:", customers);
    console.log("📌 Products:", products);
    console.log("📌 Promotions:", promotions); // Add this line
    
    res.render("dashboard/createOrder", { 
      customers, 
      products, 
      promotions, // Add this line
      page: 'createOrder' 
    });
  } catch (error) {
    console.error("🔥 Lỗi khi tải trang tạo đơn hàng:", error);
    res.status(500).send("Lỗi server khi tải trang!");
  }
};
// Lấy chi tiết đơn hàng
const getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đơn hàng không hợp lệ" 
      });
    }
    
    // Lấy chi tiết đơn hàng từ service
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng" 
      });
    }
    
    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi lấy chi tiết đơn hàng",
      error: error.message
    });
  }


};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  renderOrdersPage,
  createOrderScreen,

  getOrderDetail,
};
