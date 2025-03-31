const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const Promotion = require("../models/Promotion");

const getMobileOrders = async () => {
  try {
    const orders = await Order.find()
      .populate('customerID', 'fullName phoneNumber email address')
      .populate('employeeID', 'fullName position')
      .populate('products.productID', 'name price')
      .sort({ createdAt: -1 });

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
      products: order.products.map(product => ({
        productID: product.productID ? product.productID._id.toString() : '',
        name: product.productID ? product.productID.name : product.name,
        inventory: product.inventory || 0,
        price: product.price || 0,
        quantity: product.quantity || 1,
        attributes: product.attributes || []
      })),
      totalAmount: order.totalAmount || 0,
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || null,
      paymentStatus: order.paymentStatus || 'unpaid',
      shippingAddress: order.shippingAddress || 'Nhận hàng tại cửa hàng',
      employeeID: order.employeeID ? {
        _id: order.employeeID._id.toString(),
        fullName: order.employeeID.fullName,
        position: order.employeeID.position
      } : null,
      notes: order.notes || '',
      promotionID: order.promotionID ? order.promotionID.toString() : null,
      promotionDetails: order.promotionDetails ? {
        name: order.promotionDetails.name || '',
        discount: order.promotionDetails.discount || 0,
        discountAmount: order.promotionDetails.discountAmount || 0
      } : null,
      originalAmount: order.originalAmount || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }));

    return transformedOrders;
  } catch (error) {
    console.error('Error in getMobileOrders:', error);
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

        select: "name price inventory thumbnail attributes",


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
        select: "name price inventory thumbnail attributes",
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

    // Calculate total amount from products
    const calculatedTotal = validatedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );

    // Create order object with original amount
    const orderObj = {
      customerID: customer._id,
      products: validatedProducts,
      originalAmount: calculatedTotal, // Store original amount before any discounts
      totalAmount: orderData.totalAmount, // This may include discount
      status: "pending",
      paymentMethod: orderData.paymentMethod,
      paymentStatus: "paid",
      shippingAddress: orderData.shippingAddress,
      employeeID: orderData.employeeID || null,
      notes: orderData.notes || "",
    };

    // Handle promotion if provided
    if (orderData.promotionID && mongoose.Types.ObjectId.isValid(orderData.promotionID)) {
      const promotion = await Promotion.findById(orderData.promotionID);
      
      if (promotion) {
        // Check if promotion is active and valid date range
        const currentDate = new Date();
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);
        endDate.setHours(23, 59, 59, 999); // Include end date fully
        
        if ((currentDate >= startDate && currentDate <= endDate) && 
            promotion.status === 'active' && 
            calculatedTotal >= promotion.minOrderValue) {
          
          // Calculate discount amount
          let discountAmount = (calculatedTotal * promotion.discount) / 100;
          
          // Cap at maximum discount
          if (discountAmount > promotion.maxDiscount) {
            discountAmount = promotion.maxDiscount;
          }
          
          // Store promotion details
          orderObj.promotionID = promotion._id;
          orderObj.promotionDetails = {
            name: promotion.name,
            discount: promotion.discount,
            discountAmount: discountAmount
          };
          
          // Verify if the provided totalAmount matches our calculated discounted amount
          const calculatedDiscountedTotal = calculatedTotal - discountAmount;
          
          // If there's a significant difference, use our calculated value
          if (Math.abs(calculatedDiscountedTotal - orderData.totalAmount) > 1) {
            orderObj.totalAmount = calculatedDiscountedTotal;
          }
        }
      }
    }

    // Tạo đơn hàng mới
    const newOrder = new Order(orderObj);

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
  getMobileOrders
};