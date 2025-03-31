const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

const getMobileOrders = async () => {
  try {
    const orders = await Order.find()
      .populate({
        path: "customerID",
        model: "Customer",
        select: "fullName phoneNumber email address" 
      })
      .populate({
        path: "products.productID",
        model: "Product",
        select: "name price inventory thumbnail"
      })
      .lean()
      .exec();

    // Chuyển đổi dữ liệu để phù hợp với mobile app
    const transformedOrders = orders.map(order => ({
      _id: order._id.toString(),
      orderID: order.orderID,
      customerID: {
        _id: order.customerID ? order.customerID._id.toString() : 'unknown',
        fullName: order.customerID ? order.customerID.fullName : 'Khách hàng',
        phoneNumber: order.customerID ? order.customerID.phoneNumber : '',
        email: order.customerID ? order.customerID.email : '',
        address: order.customerID ? order.customerID.address : ''
      },
      products: (order.products || []).map(product => ({
        productID: product.productID ? product.productID._id.toString() : '',
        name: product.name || product.productID?.name || 'Sản phẩm',
        inventory: product.inventory || 0,
        price: product.price || 0,
        quantity: product.quantity || 1,
        attributes: (product.attributes || []).map(attr => ({
          name: attr.name || 'Thuộc tính',
          value: Array.isArray(attr.value) ? attr.value : [attr.value || 'Không xác định']
        }))
      })),
      totalAmount: order.totalAmount || 0,
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || 'cash',
      paymentStatus: order.paymentStatus || 'paid',
      shippingAddress: order.shippingAddress || 'Không có địa chỉ',
      notes: order.notes || '',
      createdAt: order.createdAt ? 
        (order.createdAt instanceof Date 
          ? order.createdAt.toISOString() 
          : order.createdAt) 
        : new Date().toISOString(),
      updatedAt: order.updatedAt ? 
        (order.updatedAt instanceof Date 
          ? order.updatedAt.toISOString() 
          : order.updatedAt) 
        : new Date().toISOString()
    }));

    return transformedOrders;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng cho mobile:", error);
    throw error;
  }
};

// Lấy tất cả đơn hàng
const getAllOrders = async () => {
  try {
    const orders = await Order.find()
      .populate({
        path: "customerID",
        model: "Customer",
        select: "fullName phoneNumber email address",
      }) // ✅ Thêm model
      .populate({
        path: "products.productID",
        model: "Product",
        select: "name price stockQuantity thumbnail attributes",
      })
      .populate({
        path: "employeeID",
        model: "Employee",
        select: "fullName position",
      })
      .lean();

    return orders;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    throw error;
  }
};

// Lấy đơn hàng theo ID
const getOrderById = async (orderId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("ID đơn hàng không hợp lệ!");
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "customerID",
        select: "fullName phoneNumber email address",
      })
      .populate({
        path: "products.productID",
        select: "name price stockQuantity thumbnail attributes",
      })
      .populate({
        path: "employeeID",
        select: "fullName position",
      })
      .lean();

    if (!order) throw new Error("Không tìm thấy đơn hàng!");
    return order;
  } catch (error) {
    console.error(`Lỗi khi lấy đơn hàng ID ${orderId}:`, error);
    throw error;
  }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (orderId, status) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("ID đơn hàng không hợp lệ!");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );
    if (!updatedOrder) throw new Error("Không tìm thấy đơn hàng để cập nhật!");
    return updatedOrder;
  } catch (error) {
    console.error(`Lỗi khi cập nhật đơn hàng ${orderId}:`, error);
    throw error;
  }
};

// Xóa đơn hàng theo ID
const deleteOrder = async (orderId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("ID đơn hàng không hợp lệ!");
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) throw new Error("Không tìm thấy đơn hàng để xóa!");
    return deletedOrder;
  } catch (error) {
    console.error(`Lỗi khi xóa đơn hàng ${orderId}:`, error);
    throw error;
  }
};

// Tạo đơn hàng mới
const createOrder = async (orderData) => {
  try {
    // Kiểm tra nếu `customerID` hợp lệ
    if (!mongoose.Types.ObjectId.isValid(orderData.customerID)) {
      throw new Error("ID khách hàng không hợp lệ!");
    }

    const customer = await Customer.findById(orderData.customerID);
    if (!customer) throw new Error("Không tìm thấy khách hàng!");

    // Xử lý sản phẩm
    const productPromises = orderData.products.map(async (item) => {
      if (!mongoose.Types.ObjectId.isValid(item.productID)) {
        throw new Error(`ID sản phẩm không hợp lệ: ${item.productID}`);
      }

      const product = await Product.findById(item.productID);
      if (!product)
        throw new Error(`Không tìm thấy sản phẩm với ID: ${item.productID}`);

      // Định dạng lại thuộc tính của sản phẩm
      const formattedAttributes = item.attributes.map((attr) => ({
        name: attr.name,
        value: Array.isArray(attr.value) ? attr.value : [attr.value],
      }));

      return {
        productID: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        attributes: formattedAttributes,
      };
    });

    const validatedProducts = await Promise.all(productPromises);

    // Tạo đơn hàng mới
    const newOrder = new Order({
      customerID: customer._id,
      products: validatedProducts,
      totalAmount: orderData.totalAmount,
      status: "pending",
      paymentMethod: orderData.paymentMethod,
      paymentStatus: "paid",
      shippingAddress: orderData.shippingAddress,
      employeeID: orderData.employeeID || null,
      notes: orderData.notes || "",
    });

    await newOrder.save();
    return newOrder;
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    throw error;
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  createOrder,

};

