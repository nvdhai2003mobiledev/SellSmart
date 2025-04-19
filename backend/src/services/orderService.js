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
      .populate('promotionID', 'name discount maxDiscount')
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
      paidAmount: order.paidAmount || 0,
      paymentDetails: order.paymentDetails || [],
      promotionID: order.promotionID ? order.promotionID._id.toString() : null,
      promotionDetails: order.promotionDetails ? {
        name: order.promotionDetails.name || (order.promotionID ? order.promotionID.name : ''),
        discount: order.promotionDetails.discount || (order.promotionID ? order.promotionID.discount : 0),
        discountAmount: getDiscountAmount(order)
      } : null,
      originalAmount: order.originalAmount || calculateOriginalAmount(order),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }));

    console.log('Transforming orders for mobile, example first order:');
    if (transformedOrders.length > 0) {
      console.log('ID:', transformedOrders[0]._id);
      console.log('Total Amount:', transformedOrders[0].totalAmount);
      console.log('Original Amount:', transformedOrders[0].originalAmount);
      console.log('Payment Status:', transformedOrders[0].paymentStatus);
      console.log('Paid Amount:', transformedOrders[0].paidAmount);
      console.log('Has Payment Details:', transformedOrders[0].paymentDetails.length > 0);
      
      if (transformedOrders[0].promotionDetails) {
        console.log('Promotion Details:', JSON.stringify(transformedOrders[0].promotionDetails));
      } else {
        console.log('No promotion details available');
      }
    }

    return transformedOrders;
  } catch (error) {
    console.error('Error in getMobileOrders:', error);
    throw error;
  }
};

// Hàm tính toán giá trị giảm giá từ thông tin đơn hàng
function getDiscountAmount(order) {
  if (order.promotionDetails && order.promotionDetails.discountAmount > 0) {
    return order.promotionDetails.discountAmount;
  }
  
  if (order.originalAmount && order.totalAmount) {
    return order.originalAmount - order.totalAmount;
  }
  
  const productsTotal = order.products.reduce((sum, item) => 
    sum + (item.price || 0) * (item.quantity || 1), 0);
  
  if (productsTotal > order.totalAmount) {
    return productsTotal - order.totalAmount;
  }
  
  return 0;
}

// Hàm tính toán giá gốc nếu không có sẵn
function calculateOriginalAmount(order) {
  if (order.originalAmount) {
    return order.originalAmount;
  }
  
  if (order.promotionDetails && order.promotionDetails.discountAmount) {
    return order.totalAmount + order.promotionDetails.discountAmount;
  }
  
  return order.products.reduce((sum, item) => 
    sum + (item.price || 0) * (item.quantity || 1), 0);
}

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
      .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo giảm dần (mới nhất đến cũ nhất)
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

    // Kiểm tra xem trường employeeID có tham chiếu đến Employee hay User
    const order = await Order.findById(orderId);
    
    if (!order) throw new Error("Không tìm thấy đơn hàng!");
    
    // Tải đơn hàng với đầy đủ thông tin
    const populatedOrder = await Order.findById(orderId)
      .populate({
        path: "customerID",
        select: "fullName phoneNumber email address",
      })
      .populate({
        path: "products.productID",
        select: "name price inventory thumbnail attributes",
      });
    
    // Nếu có employeeID, kiểm tra xem nó là ID của Employee hay User
    if (order.employeeID) {
      // Thử tải thông tin từ Employee trước
      const isEmployee = await Employee.findById(order.employeeID).lean();
      
      if (isEmployee) {
        // Nếu tìm thấy trong Employee, populate thông tin nhân viên bình thường
        await populatedOrder.populate({
          path: "employeeID",
          model: "Employee",
          select: "userId position",
          populate: {
            path: "userId",
            model: "User",
            select: "fullName username"
          }
        });
      } else {
        // Nếu không tìm thấy trong Employee, thử load từ User
        await populatedOrder.populate({
          path: "employeeID",
          model: "User", 
          select: "fullName username role"
        });
      }
    }
    
    // Chuyển đổi sang đối tượng thường để dễ xử lý
    let orderData = populatedOrder.toObject();
    
    // Định dạng lại thuộc tính employeeID
    if (orderData.employeeID) {
      if (orderData.employeeID.userId) {
        // Nếu là Employee với userId
        orderData.employeeID = {
          _id: orderData.employeeID._id,
          fullName: orderData.employeeID.userId.fullName,
          position: orderData.employeeID.position
        };
      }
      // Nếu là User thì đã có fullName rồi, giữ nguyên
    }
    
    return orderData;
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

    // Log thông tin thanh toán để debug
    console.log('=== SERVICE - THÔNG TIN THANH TOÁN ===');
    console.log(`Phương thức thanh toán: ${orderData.paymentMethod}`);
    console.log(`Trạng thái thanh toán: ${orderData.paymentStatus}`);
    console.log(`Số tiền đã thanh toán: ${orderData.paidAmount}`);
    console.log(`Chi tiết thanh toán:`, JSON.stringify(orderData.paymentDetails));

    // Create order object with original amount
    const orderObj = {
      customerID: customer._id,
      products: validatedProducts,
      originalAmount: calculatedTotal, // Store original amount before any discounts
      totalAmount: orderData.totalAmount, // This may include discount
      status: orderData.status || "pending",
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || "unpaid",
      shippingAddress: orderData.shippingAddress,
      employeeID: orderData.employeeID || null,
      notes: orderData.notes || "",
      // Thêm thông tin thanh toán
      paidAmount: orderData.paidAmount || 0,
      paymentDetails: orderData.paymentDetails || []
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

// Get paginated orders
const getPaginatedOrders = async (page = 1, pageSize = 10, filters = {}) => {
  try {
    const skip = (page - 1) * pageSize;
    
    // Build filter query
    const filterQuery = {};
    
    if (filters.orderID) {
      // Match the last 4 characters of orderID instead of the entire string
      const searchTerm = filters.orderID.trim();
      if (searchTerm.length > 0) {
        // Create an aggregation pipeline to allow more complex matching
        return await getOrdersByLastDigits(searchTerm, page, pageSize, filters);
      }
    }
    
    if (filters.customerName) {
      const customers = await Customer.find({ 
        fullName: { $regex: filters.customerName, $options: 'i' } 
      });
      const customerIds = customers.map(c => c._id);
      if (customerIds.length > 0) {
        filterQuery.customerID = { $in: customerIds };
      } else {
        // No matching customers found, return empty results
        return { orders: [], total: 0, totalPages: 0 };
      }
    }
    
    if (filters.phone) {
      const customers = await Customer.find({ 
        phoneNumber: { $regex: filters.phone, $options: 'i' } 
      });
      const customerIds = customers.map(c => c._id);
      if (customerIds.length > 0) {
        filterQuery.customerID = { $in: customerIds };
      } else {
        // No matching customers found, return empty results
        return { orders: [], total: 0, totalPages: 0 };
      }
    }
    
    if (filters.status && filters.status !== '') {
      filterQuery.status = filters.status;
    }
    
    if (filters.paymentStatus && filters.paymentStatus !== '') {
      filterQuery.paymentStatus = filters.paymentStatus;
    }
    
    if (filters.fromDate) {
      if (!filterQuery.createdAt) {
        filterQuery.createdAt = {};
      }
      filterQuery.createdAt.$gte = new Date(filters.fromDate);
    }
    
    if (filters.toDate) {
      if (!filterQuery.createdAt) {
        filterQuery.createdAt = {};
      }
      const toDateObj = new Date(filters.toDate);
      toDateObj.setHours(23, 59, 59, 999);
      filterQuery.createdAt.$lte = toDateObj;
    }
    
    // Count total matching documents
    const totalOrders = await Order.countDocuments(filterQuery);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / pageSize);
    
    // Get paginated orders
    const orders = await Order.find(filterQuery)
      .populate({
        path: "customerID",
        model: "Customer",
        select: "fullName phoneNumber email address",
      })
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();
    
    return {
      orders,
      total: totalOrders,
      totalPages
    };
  } catch (error) {
    console.error("Error fetching paginated orders:", error);
    throw error;
  }
};

// Specialized function to search orders by the last 4 characters of orderID
const getOrdersByLastDigits = async (searchTerm, page = 1, pageSize = 10, filters = {}) => {
  try {
    const skip = (page - 1) * pageSize;
    console.log(`Searching for orders where the last 4 characters of orderID contain: '${searchTerm}'`);
    
    // Create aggregation pipeline
    const pipeline = [];
    
    // Stage 1: Add a field containing the last 4 characters of orderID
    pipeline.push({
      $addFields: {
        lastFourChars: {
          $substr: ["$orderID", { $subtract: [{ $strLenCP: "$orderID" }, 4] }, 4]
        }
      }
    });
    
    // Stage 2: Match orders where lastFourChars contains the search term
    pipeline.push({
      $match: {
        lastFourChars: { $regex: searchTerm, $options: 'i' }
      }
    });
    
    // Add other filters if provided
    if (filters.customerName) {
      // We need to do a lookup to search by customer name
      pipeline.push(
        {
          $lookup: {
            from: "customers",
            localField: "customerID",
            foreignField: "_id",
            as: "customerDetails"
          }
        },
        {
          $match: {
            "customerDetails.fullName": { $regex: filters.customerName, $options: 'i' }
          }
        }
      );
    }
    
    if (filters.phone) {
      // We need to do a lookup to search by phone number
      if (!pipeline.some(stage => stage.$lookup && stage.$lookup.as === "customerDetails")) {
        pipeline.push({
          $lookup: {
            from: "customers",
            localField: "customerID",
            foreignField: "_id",
            as: "customerDetails"
          }
        });
      }
      
      pipeline.push({
        $match: {
          "customerDetails.phoneNumber": { $regex: filters.phone, $options: 'i' }
        }
      });
    }
    
    if (filters.status && filters.status !== '') {
      pipeline.push({
        $match: { status: filters.status }
      });
    }
    
    if (filters.paymentStatus && filters.paymentStatus !== '') {
      pipeline.push({
        $match: { paymentStatus: filters.paymentStatus }
      });
    }
    
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      pipeline.push({
        $match: { createdAt: { $gte: fromDate } }
      });
    }
    
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      pipeline.push({
        $match: { createdAt: { $lte: toDate } }
      });
    }
    
    // Clone the pipeline to count total orders
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "totalOrders" });
    
    // Add pagination to the main pipeline
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize }
    );
    
    // Add lookups to populate related fields
    pipeline.push(
      {
        $lookup: {
          from: "customers",
          localField: "customerID",
          foreignField: "_id",
          as: "customerDetails"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productID",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeID",
          foreignField: "_id",
          as: "employeeDetails"
        }
      }
    );
    
    // Unwind arrays and format output
    pipeline.push({
      $addFields: {
        customerID: {
          $cond: {
            if: { $gt: [{ $size: "$customerDetails" }, 0] },
            then: {
              _id: { $arrayElemAt: ["$customerDetails._id", 0] },
              fullName: { $arrayElemAt: ["$customerDetails.fullName", 0] },
              phoneNumber: { $arrayElemAt: ["$customerDetails.phoneNumber", 0] },
              email: { $arrayElemAt: ["$customerDetails.email", 0] },
              address: { $arrayElemAt: ["$customerDetails.address", 0] }
            },
            else: null
          }
        },
        employeeID: {
          $cond: {
            if: { $gt: [{ $size: "$employeeDetails" }, 0] },
            then: {
              _id: { $arrayElemAt: ["$employeeDetails._id", 0] },
              fullName: { $arrayElemAt: ["$employeeDetails.fullName", 0] },
              position: { $arrayElemAt: ["$employeeDetails.position", 0] }
            },
            else: null
          }
        }
      }
    });
    
    // Remove temporary fields
    pipeline.push({
      $project: {
        customerDetails: 0,
        productDetails: 0,
        employeeDetails: 0,
        lastFourChars: 0
      }
    });
    
    // Execute the aggregation
    const orders = await Order.aggregate(pipeline);
    
    // Count total matching orders
    const countResult = await Order.aggregate(countPipeline);
    const totalOrders = countResult.length > 0 ? countResult[0].totalOrders : 0;
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / pageSize);
    
    console.log(`Found ${totalOrders} orders matching the search criteria.`);
    
    return {
      orders,
      total: totalOrders,
      totalPages
    };
  } catch (error) {
    console.error("Error in getOrdersByLastDigits:", error);
    throw error;
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  createOrder,
  getMobileOrders,
  getPaginatedOrders,
  getOrdersByLastDigits
};