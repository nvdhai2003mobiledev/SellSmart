const orderService = require('../services/orderService');
const mongoose = require("mongoose");
const Order = require("../models/Order"); 
const Customer = require('../models/Customer'); 
const Product = require('../models/Product'); 
const Employee = require('../models/Employee'); 

const createOrder = async (req, res) => {
    try {
        const { customerID, products, totalAmount, paymentMethod, shippingAddress, notes, employeeID } = req.body;

        // Kiểm tra `customerID` có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(customerID)) {
            return res.status(400).json({ message: `Invalid customer ID format: ${customerID}` });
        }

        // Kiểm tra `employeeID` (nếu có)
        if (employeeID && !mongoose.Types.ObjectId.isValid(employeeID)) {
            return res.status(400).json({ message: `Invalid employee ID format: ${employeeID}` });
        }

        // Kiểm tra từng `productID` trong danh sách `products`
        const formattedProducts = await Promise.all(products.map(async (p) => {
            if (!mongoose.Types.ObjectId.isValid(p.productID)) {
                throw new Error(`Invalid product ID format: ${p.productID}`);
            }
            // Kiểm tra sản phẩm có tồn tại không
            const product = await Product.findById(p.productID);
            if (!product) {
                throw new Error(`Product not found: ${p.productID}`);
            }
            return {
                productID: new mongoose.Types.ObjectId(p.productID),
                name: product.name,
                quantity: p.quantity,
                price: product.price
            };
        }));

        const newOrder = new Order({
            customerID: new mongoose.Types.ObjectId(customerID),
            products: formattedProducts,
            totalAmount,
            paymentMethod,
            shippingAddress,
            notes,
            employeeID: employeeID ? new mongoose.Types.ObjectId(employeeID) : null
        });

        await newOrder.save();
        res.status(201).json({ message: "Order created successfully!", order: newOrder });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await orderService.getAllOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
const renderOrdersPage = async (req, res) => {
  try {
      const orders = await getAllOrders(); // Lấy danh sách đơn hàng
      
      if (!orders || orders.length === 0) {
          return res.render('orders', { orders: [] }); // Nếu không có dữ liệu, gửi mảng rỗng để tránh lỗi
      }

      res.render('orders', { orders });
  } catch (error) {
      res.status(500).send("Lỗi server: " + error.message);
  }
};

const getOrderById = async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const updatedOrder = await orderService.updateOrderStatus(req.params.id, req.body.status);
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        await orderService.deleteOrder(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus, deleteOrder,renderOrdersPage };
