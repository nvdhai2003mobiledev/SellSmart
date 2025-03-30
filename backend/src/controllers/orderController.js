const orderService = require("../services/OrderService");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Employee = require("../models/Employee");

const createOrder = async (req, res) => {
  try {
    const {
      customerID,
      products,
      totalAmount,
      paymentMethod,
      paymentStatus,
      shippingAddress,
      notes,
      status,
      employeeID
    } = req.body;

    if (
      !customerID ||
      !products ||
      products.length === 0 ||
      !totalAmount ||
      !shippingAddress
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ" });
    }

    // Handle payment method based on payment status
    let finalPaymentMethod = paymentMethod;
    if (paymentStatus === 'unpaid') {
      // For unpaid orders, we don't require a payment method yet
      finalPaymentMethod = null;
    } else if (!paymentMethod) {
      // For paid orders, require payment method
      return res
        .status(400)
        .json({ success: false, message: "Phương thức thanh toán không hợp lệ" });
    }

    const newOrder = new Order({
      orderID: `ORD-${Date.now()}`,
      customerID,
      products,
      totalAmount,
      paymentMethod: finalPaymentMethod,
      paymentStatus: paymentStatus || 'unpaid',
      status: status || 'pending',
      shippingAddress,
      employeeID,
      notes,
    });

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
    res.render("dashboard/orders", {
      orders,
      page: "orders",
      title: "Quản lý đơn hàng",
    });
  } catch (error) {
    console.error("🔥 Lỗi server khi lấy danh sách đơn hàng:", error);
    res
      .status(500)
      .json({ message: "Lỗi máy chủ nội bộ!", error: error.message });
  }
};
// Endpoint mới cho mobile để lấy danh sách đơn hàng
const getMobileOrdersList = async (req, res) => {
  try {
    const orders = await orderService.getMobileOrders();
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error("🔥 Lỗi server khi lấy danh sách đơn hàng cho mobile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ khi lấy danh sách đơn hàng", 
      error: error.message 
    });
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
const getOrderDetail = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng" 
      });
    }
    res.json({ 
      success: true, 
      message: "Lấy thông tin đơn hàng thành công", 
      order 
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi lấy thông tin đơn hàng", 
      error: error.message 
    });
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

const updateOrderPayment = async (req, res) => {
  try {
    const { paymentMethod, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đơn hàng không hợp lệ" 
      });
    }

    // Find the order first to check if it exists
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng" 
      });
    }

    // Validate payment method (required if updating to paid status)
    if (paymentStatus === 'paid' && !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Phương thức thanh toán là bắt buộc khi đánh dấu đã thanh toán"
      });
    }

    // Prepare update object
    const updateData = {
      paymentStatus: paymentStatus || 'paid' // Default to paid if not specified
    };

    // Only update payment method if provided
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    // Set status to 'processing' only when updating from 'unpaid' to 'paid'
    if (order.paymentStatus === 'unpaid' && paymentStatus === 'paid') {
      updateData.status = 'processing';
    }

    // Update order with payment details
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Cập nhật thông tin thanh toán thành công",
      data: updatedOrder
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin thanh toán:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi cập nhật thông tin thanh toán",
      error: error.message
    });
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
    console.log("📌 Customers:", customers);
    console.log("📌 Products:", products);
    res.render("dashboard/createOrder", {
      customers,
      products,
      page: "createOrder",
    });
  } catch (error) {
    console.error("🔥 Lỗi khi tải trang tạo đơn hàng:", error);
    res.status(500).send("Lỗi server khi tải trang!");
  }
};
const getOrdersJson = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  getOrdersJson,
  getMobileOrdersList,
  getOrderDetail,
  updateOrderPayment
};
