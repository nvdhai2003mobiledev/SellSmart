const orderService = require("../services/orderService");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Employee = require("../models/Employee");
const DetailsVariant = require("../models/DetailsVariant");
const Variant = require("../models/Variant");

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
      employeeID,
      promotionID
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
      promotionID
    });

    await newOrder.save();

    // Nếu trạng thái đơn hàng là "processing" hoặc đã thanh toán, cập nhật tồn kho
    if (newOrder.status === 'processing' || newOrder.paymentStatus === 'paid') {
      await updateInventoryForOrder(newOrder);
    }

    res.json({
      success: true,
      message: "Đơn hàng đã được tạo thành công!",
      order: newOrder,
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo đơn hàng", error: error.message });
  }
};

/**
 * Cập nhật tồn kho cho đơn hàng
 * @param {Object} order - Đơn hàng đã được tạo
 */
const updateInventoryForOrder = async (order) => {
  try {
    console.log(`===== BẮT ĐẦU CẬP NHẬT TỒN KHO =====`);
    console.log(`Đơn hàng: ${order._id}, Trạng thái: ${order.status}, Thanh toán: ${order.paymentStatus}`);
    
    if (!order.products || order.products.length === 0) {
      console.log('Không có sản phẩm nào để cập nhật tồn kho');
      return;
    }
    
    // Xử lý từng sản phẩm trong đơn hàng
    for (const orderProduct of order.products) {
      console.log(`\n------ Xử lý sản phẩm: ${orderProduct.name} ------`);
      
      const productID = orderProduct.productID._id || orderProduct.productID.toString();
      const quantity = orderProduct.quantity || 1;
      
      console.log(`ID Sản phẩm: ${productID}`);
      console.log(`Số lượng: ${quantity}`);
      
      // Kiểm tra nếu có variantID
      const variantID = orderProduct.variantID?._id || orderProduct.variantID || null;
      
      if (variantID) {
        console.log(`Biến thể ID: ${variantID}`);
        
        // Tìm kiếm biến thể và cập nhật
        const variant = await DetailsVariant.findById(variantID);
        
        if (variant) {
          console.log(`Tìm thấy biến thể: ${variant._id}`);
          console.log(`Tồn kho biến thể hiện tại: ${variant.inventory}`);
          
          // Kiểm tra tồn kho
          if (variant.inventory < quantity) {
            console.log(`Cảnh báo: Không đủ tồn kho (cần ${quantity}, hiện có ${variant.inventory})`);
            continue;
          }
          
          // Cập nhật tồn kho
          const oldInventory = variant.inventory;
          variant.inventory -= quantity;
          
          // Lưu thay đổi
          await variant.save();
          
          console.log(`Đã cập nhật tồn kho biến thể: ${oldInventory} -> ${variant.inventory}`);
        } else {
          console.log(`Không tìm thấy biến thể với ID: ${variantID}`);
        }
      } else {
        // Nếu không có biến thể, cập nhật tồn kho sản phẩm chính
        const product = await Product.findById(productID);
        
        if (product) {
          console.log(`Tìm thấy sản phẩm: ${product.name}`);
          console.log(`Tồn kho sản phẩm hiện tại: ${product.inventory}`);
          
          // Kiểm tra tồn kho
          if (product.inventory < quantity) {
            console.log(`Cảnh báo: Không đủ tồn kho (cần ${quantity}, hiện có ${product.inventory})`);
            continue;
          }
          
          // Cập nhật tồn kho
          const oldInventory = product.inventory;
          product.inventory -= quantity;
          
          // Lưu thay đổi
          await product.save();
          
          console.log(`Đã cập nhật tồn kho sản phẩm: ${oldInventory} -> ${product.inventory}`);
        } else {
          console.log(`Không tìm thấy sản phẩm với ID: ${productID}`);
        }
      }
    }
    
    console.log(`===== HOÀN THÀNH CẬP NHẬT TỒN KHO =====`);
  } catch (error) {
    console.error(`LỖI CẬP NHẬT TỒN KHO: ${error.message}`);
    console.error(error.stack);
  }
};

/**
 * Xử lý cập nhật tồn kho cho một sản phẩm
 * @param {Object} product - Sản phẩm từ database
 * @param {Object} orderProduct - Sản phẩm trong đơn hàng
 */
const processProductInventory = async (product, orderProduct) => {
  try {
    console.log(`Sản phẩm: ${product.name}`);
    console.log(`ID: ${product._id}`);
    console.log(`hasVariants: ${product.hasVariants}`);
    console.log(`Số lượng trong đơn hàng: ${orderProduct.quantity}`);
    
    if (orderProduct.attributes) {
      console.log(`Attributes: ${JSON.stringify(orderProduct.attributes)}`);
    } else {
      console.log(`Không có thuộc tính (attributes)`);
    }
      
    // Lấy số lượng từ đơn hàng
    const orderQuantity = orderProduct.quantity || 1;

    // Kiểm tra nếu sản phẩm có biến thể
    if (product.hasVariants && orderProduct.attributes && orderProduct.attributes.length > 0) {
      // Kiểm tra trực tiếp trong database DetailsVariant
      const detailsVariantCount = await DetailsVariant.countDocuments({ 
        productId: { $in: [product._id, product._id.toString()] } 
      });
      console.log(`Tìm thấy ${detailsVariantCount} biến thể trong DB theo productId`);
    
      // Tìm chi tiết biến thể phù hợp với thuộc tính trong đơn hàng
      await updateVariantInventory(product, orderProduct, orderQuantity);
    } else {
      // Sản phẩm không có biến thể, cập nhật trực tiếp vào tồn kho sản phẩm
      await updateProductInventory(product, orderQuantity);
    }
  } catch (error) {
    console.error(`Lỗi khi xử lý tồn kho cho sản phẩm ${product._id}:`, error.message);
  }
};

/**
 * Cập nhật tồn kho cho sản phẩm có biến thể
 * @param {Object} product - Sản phẩm
 * @param {Object} orderProduct - Sản phẩm trong đơn hàng
 * @param {Number} quantity - Số lượng
 */
const updateVariantInventory = async (product, orderProduct, quantity) => {
  try {
    console.log('=== DEBUG: START updateVariantInventory ===');
    console.log(`Sản phẩm: ${product.name}, ID: ${product._id}`);
    
    // Kiểm tra nếu có variantID trực tiếp từ đơn hàng - cách ưu tiên
    if (orderProduct.variantID) {
      console.log(`Tìm biến thể trực tiếp với ID: ${orderProduct.variantID}`);
      
      // Tìm trực tiếp bằng ID biến thể
      const variantById = await DetailsVariant.findById(orderProduct.variantID);
      
      if (variantById) {
        console.log(`Đã tìm thấy biến thể: ${variantById._id}`);
        
        // Kiểm tra tồn kho
        if (variantById.inventory < quantity) {
          console.warn(`Không đủ tồn kho. Hiện tại: ${variantById.inventory}, Cần: ${quantity}`);
          return;
        }
        
        // Lưu lại tồn kho cũ để ghi log
        const oldInventory = variantById.inventory;
        
        // Cập nhật tồn kho
        variantById.inventory -= quantity;
        
        // Sử dụng findByIdAndUpdate để đảm bảo cập nhật đúng document
        await DetailsVariant.findByIdAndUpdate(
          variantById._id,
          { $set: { inventory: variantById.inventory } },
          { new: true }
        );
        
        console.log(`Đã cập nhật tồn kho biến thể ${variantById._id} của sản phẩm ${product.name}:`);
        console.log(`  Tồn kho cũ: ${oldInventory}`);
        console.log(`  Tồn kho mới: ${variantById.inventory}`);
        console.log(`  Số lượng đã trừ: ${quantity}`);
        
        return; // Thoát sớm vì đã xử lý xong
      } else {
        console.log(`Không tìm thấy biến thể với ID: ${orderProduct.variantID}, sẽ tìm theo thuộc tính`);
      }
    }
    
    console.log(`Thuộc tính sản phẩm trong đơn hàng:`, JSON.stringify(orderProduct.attributes, null, 2));
    
    // Bước 1: Thu thập tất cả các thuộc tính từ đơn hàng vào một mảng đơn giản
    // để dễ dàng so sánh, bỏ qua cấu trúc name-value phức tạp
    const orderAttributesSimpleArray = [];
    orderProduct.attributes.forEach(attr => {
      if (Array.isArray(attr.value)) {
        attr.value.forEach(val => {
          orderAttributesSimpleArray.push(val.toString().trim().toLowerCase());
        });
      } else if (attr.value) {
        orderAttributesSimpleArray.push(attr.value.toString().trim().toLowerCase());
      }
    });
    
    console.log('Thuộc tính được chuẩn hóa thành mảng đơn giản:', orderAttributesSimpleArray);
    
    // Lấy danh sách chi tiết biến thể - sử dụng nhiều cách tìm kiếm
    let detailsVariants = await DetailsVariant.find({ 
      $or: [
        { productId: product._id },
        { productId: product._id.toString() }
      ]
    });
    
    // Nếu không tìm thấy, thử phương pháp khác
    if (detailsVariants.length === 0) {
      console.log('Không tìm thấy biến thể với truy vấn thông thường, thử phương pháp khác...');
      
      // Tìm tất cả chi tiết biến thể
      const allVariants = await DetailsVariant.find({}).lean();
      console.log(`Tổng số chi tiết biến thể trong DB: ${allVariants.length}`);
      
      // Lọc thủ công bằng cách so sánh
      detailsVariants = allVariants.filter(v => 
        v.productId && (
          v.productId.toString() === product._id.toString() ||
          (typeof v.productId === 'string' && v.productId === product._id.toString())
        )
      );
      
      console.log(`Tìm thấy ${detailsVariants.length} chi tiết biến thể sau khi lọc thủ công`);
    } else {
      console.log(`Tìm thấy ${detailsVariants.length} chi tiết biến thể cho sản phẩm`);
    }
    
    if (detailsVariants.length === 0) {
      console.warn(`Không tìm thấy chi tiết biến thể cho sản phẩm ${product._id}`);
      return;
    }

    // Bước 2: Thu thập các giá trị thuộc tính từ mỗi biến thể vào mảng đơn giản
    let bestMatchVariant = null;
    let highestMatchCount = 0;
    let bestMatchScore = 0;
    
    console.log('Bắt đầu tìm biến thể phù hợp nhất...');
    
    for (let i = 0; i < detailsVariants.length; i++) {
      const variant = detailsVariants[i];
      console.log(`\n------- Biến thể #${i+1} (ID: ${variant._id}) -------`);
      
      // Thu thập tất cả các giá trị thuộc tính của biến thể
      const variantAttributesSimpleArray = [];
      let variantDetailsLog = [];
      
      for (const detail of variant.variantDetails) {
        try {
          const variantInfo = await Variant.findById(detail.variantId);
          
          if (variantInfo) {
            const attrValue = detail.value.toString().trim().toLowerCase();
            variantAttributesSimpleArray.push(attrValue);
            variantDetailsLog.push(`${variantInfo.name}: ${detail.value}`);
            console.log(`   - Biến thể thuộc tính: ${variantInfo.name} = ${detail.value}`);
          }
        } catch (e) {
          console.log(`   - Lỗi khi xử lý thuộc tính biến thể: ${e.message}`);
        }
      }
      
      console.log(`   - Giá trị thuộc tính biến thể: [${variantAttributesSimpleArray.join(', ')}]`);
      console.log(`   - Chi tiết biến thể: ${variantDetailsLog.join(', ')}`);
      
      // Đếm số thuộc tính khớp
      let matchCount = 0;
      let matchScore = 0;
      
      // Kiểm tra từng thuộc tính của biến thể
      variantAttributesSimpleArray.forEach(variantAttr => {
        const isMatch = orderAttributesSimpleArray.some(orderAttr => 
          orderAttr.includes(variantAttr) || variantAttr.includes(orderAttr));
        
        if (isMatch) {
          matchCount++;
          // Nếu khớp chính xác, điểm cao hơn
          if (orderAttributesSimpleArray.includes(variantAttr)) {
            matchScore += 2;
          } else {
            matchScore += 1;
          }
        }
      });
      
      console.log(`   - Số thuộc tính khớp: ${matchCount}/${variantAttributesSimpleArray.length}`);
      console.log(`   - Điểm khớp: ${matchScore}`);
      
      // Nếu tất cả thuộc tính đều khớp và số lượng bằng nhau
      if (matchCount === variantAttributesSimpleArray.length && 
          matchCount === orderAttributesSimpleArray.length) {
        console.log('   >>> Biến thể khớp hoàn toàn!');
        bestMatchVariant = variant;
        highestMatchCount = matchCount;
        bestMatchScore = matchScore;
        break; // Đã tìm thấy khớp hoàn toàn, dừng tìm kiếm
      }
      
      // Nếu là trường hợp khớp tốt hơn
      if (matchScore > bestMatchScore || 
          (matchScore === bestMatchScore && matchCount > highestMatchCount)) {
        console.log('   >>> Biến thể khớp tốt nhất tạm thời');
        bestMatchVariant = variant;
        highestMatchCount = matchCount;
        bestMatchScore = matchScore;
      }
    }
    
    // Bước 3: Cập nhật tồn kho cho biến thể khớp nhất
    if (bestMatchVariant) {
      console.log(`\nĐã tìm thấy biến thể phù hợp nhất: ${bestMatchVariant._id}`);
      console.log(`Điểm khớp: ${bestMatchScore}, Số thuộc tính khớp: ${highestMatchCount}`);
      
      if (bestMatchVariant.inventory < quantity) {
        console.warn(`Không đủ tồn kho. Hiện tại: ${bestMatchVariant.inventory}, Cần: ${quantity}`);
        return;
      }
      
      const oldInventory = bestMatchVariant.inventory;
      
      // Trừ tồn kho và lưu
      bestMatchVariant.inventory -= quantity;
      
      // Sử dụng findByIdAndUpdate để đảm bảo cập nhật đúng document
      await DetailsVariant.findByIdAndUpdate(
        bestMatchVariant._id,
        { $set: { inventory: bestMatchVariant.inventory } },
        { new: true }
      );
      
      console.log(`Đã cập nhật tồn kho biến thể ${bestMatchVariant._id} của sản phẩm ${product.name}:`);
      console.log(`  Tồn kho cũ: ${oldInventory}`);
      console.log(`  Tồn kho mới: ${bestMatchVariant.inventory}`);
      console.log(`  Số lượng đã trừ: ${quantity}`);
    } else {
      console.warn(`Không tìm thấy biến thể phù hợp với thuộc tính cho sản phẩm ${product.name}`);
    }
    
    console.log('=== DEBUG: END updateVariantInventory ===');
  } catch (error) {
    console.error(`Lỗi khi cập nhật tồn kho biến thể: ${error.message}`);
    console.error(error.stack);
  }
};

/**
 * Cập nhật tồn kho cho sản phẩm không có biến thể
 * @param {Object} product - Sản phẩm
 * @param {Number} quantity - Số lượng
 */
const updateProductInventory = async (product, quantity) => {
  try {
    // Kiểm tra nếu có đủ tồn kho
    if (product.inventory < quantity) {
      console.warn(`Không đủ tồn kho cho sản phẩm ${product.name}. Hiện tại: ${product.inventory}, Cần: ${quantity}`);
      return;
    }
    
    // Cập nhật tồn kho sản phẩm
    product.inventory -= quantity;
    await product.save();
    
    console.log(`Đã cập nhật tồn kho sản phẩm ${product.name}: ${product.inventory + quantity} -> ${product.inventory}`);
  } catch (error) {
    console.error(`Lỗi khi cập nhật tồn kho sản phẩm: ${error.message}`);
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
    console.log(`Chi tiết đơn hàng trước khi cập nhật:`, JSON.stringify(order, null, 2));
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

// Hàm độc lập để xử lý việc cập nhật tồn kho
const processOrderStatusChange = async (orderId, newStatus) => {
  try {
    console.log(`\n===== XỬ LÝ THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG =====`);
    console.log(`Đơn hàng: ${orderId}, Trạng thái mới: ${newStatus}`);
    
    // Lấy đơn hàng đầy đủ thông tin
    const order = await Order.findById(orderId)
      .populate('products.productID')
      .populate('products.variantID');
    
    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng ID ${orderId}`);
    }
    
    const oldStatus = order.status;
    
    // Cập nhật trạng thái
    order.status = newStatus;
    
    // Nếu đơn hàng bị hủy, đặt tổng tiền về 0
    if (newStatus === 'canceled') {
      console.log(`Đơn hàng ${orderId} bị hủy, đặt tổng tiền về 0`);
      order.totalAmount = 0;
    }
    
    await order.save();
    
    // Kiểm tra và cập nhật tồn kho
    if (newStatus === 'processing' && oldStatus !== 'processing') {
      console.log(`Đơn hàng ${orderId} chuyển từ ${oldStatus} sang processing, sẽ cập nhật tồn kho`);
      console.log(`Đơn hàng có ${order.products.length} sản phẩm cần cập nhật`);
      
      // In thông tin sản phẩm
      order.products.forEach((product, idx) => {
        console.log(`Sản phẩm #${idx+1}: ${product.name}, SL: ${product.quantity}`);
        if (product.variantID) {
          console.log(`  - Có biến thể: ${product.variantID}`);
        }
      });
      
      // Tạo đối tượng để cập nhật tồn kho
      const orderObj = order.toObject();
      await updateInventoryForOrder(orderObj);
      
      return true;
    } else if (newStatus === 'canceled') {
      console.log(`Đơn hàng ${orderId} chuyển sang trạng thái canceled, sẽ kiểm tra để hoàn trả tồn kho`);
      
      // Chỉ hoàn trả tồn kho nếu đơn hàng đã thanh toán
      if (order.paymentStatus === 'paid') {
        console.log(`Đơn hàng đã thanh toán, sẽ hoàn trả tồn kho`);
        
        // In thông tin sản phẩm
        order.products.forEach((product, idx) => {
          console.log(`Sản phẩm #${idx+1}: ${product.name}, SL cần hoàn trả: ${product.quantity}`);
          if (product.variantID) {
            console.log(`  - Có biến thể: ${product.variantID}`);
          }
        });
        
        // Tạo đối tượng để hoàn trả tồn kho
        const orderObj = order.toObject();
        await restoreInventoryForOrder(orderObj);
        
        return true;
      } else {
        console.log(`Đơn hàng chưa thanh toán (${order.paymentStatus}), không cần hoàn trả tồn kho`);
        return false;
      }
    } else {
      console.log(`Không cần cập nhật tồn kho cho trạng thái ${newStatus}`);
      return false;
    }
  } catch (error) {
    console.error(`Lỗi xử lý thay đổi trạng thái:`, error);
    throw error;
  } finally {
    console.log(`===== KẾT THÚC XỬ LÝ THAY ĐỔI TRẠNG THÁI =====\n`);
  }
};

// Thay thế hàm updateOrderStatus hiện tại
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;
    const cancelReason = req.body.cancelReason;
    
    console.log(`Nhận yêu cầu thay đổi trạng thái đơn hàng ${orderId} thành ${newStatus}`);
    if (cancelReason) {
      console.log(`Lý do hủy đơn hàng: ${cancelReason}`);
    }
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }
    
    if (!newStatus) {
      return res.status(400).json({ message: "Trạng thái đơn hàng không được để trống" });
    }
    
    // Lấy đơn hàng để cập nhật
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    // Lưu lý do hủy đơn hàng nếu có
    if (newStatus === 'canceled' && cancelReason) {
      order.cancelReason = cancelReason;
      await order.save();
      console.log(`Đã lưu lý do hủy đơn hàng: ${cancelReason}`);
    }
    
    await processOrderStatusChange(orderId, newStatus);
    
    // Lấy đơn hàng đã cập nhật để trả về
    const updatedOrder = await Order.findById(orderId);
    
    if (!updatedOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const updateOrderPayment = async (req, res) => {
  try {
    console.log("\n===== BẮT ĐẦU CẬP NHẬT THANH TOÁN =====");
    const { paymentMethod, paymentStatus } = req.body;
    console.log(`Đơn hàng ID: ${req.params.id}, PT thanh toán: ${paymentMethod}, Trạng thái: ${paymentStatus}`);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID đơn hàng không hợp lệ" 
      });
    }

    // Tìm đơn hàng đầy đủ thông tin để cập nhật tồn kho
    const order = await Order.findById(req.params.id)
      .populate('products.productID')
      .populate('products.variantID');
      
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng" 
      });
    }

    // Trạng thái thanh toán cũ để so sánh
    const oldPaymentStatus = order.paymentStatus;
    console.log(`Trạng thái thanh toán hiện tại: ${oldPaymentStatus}`);

    // Validate payment method (required if updating to paid status)
    if (paymentStatus === 'paid' && !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Phương thức thanh toán là bắt buộc khi đánh dấu đã thanh toán"
      });
    }

    // Cập nhật trực tiếp vào đối tượng order
    order.paymentStatus = paymentStatus || 'paid'; // Default to paid if not specified
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }

    // Set status to 'processing' khi chuyển từ 'unpaid' sang 'paid'
    if (oldPaymentStatus === 'unpaid' && paymentStatus === 'paid') {
      order.status = 'processing';
      
      // In thông tin về các sản phẩm sẽ cập nhật tồn kho
      console.log(`===> CẬP NHẬT TỒN KHO KHI THAY ĐỔI THANH TOÁN <===`);
      console.log(`Số sản phẩm cần cập nhật: ${order.products.length}`);
      
      try {
        // Tạo bản sao của order để cập nhật tồn kho
        const orderForInventory = order.toObject();
        await updateInventoryForOrder(orderForInventory);
        console.log("Đã hoàn thành cập nhật tồn kho sau khi thanh toán");
      } catch (inventoryError) {
        console.error("Lỗi khi cập nhật tồn kho:", inventoryError);
      }
    }

    // Lưu thay đổi vào DB
    await order.save();
    console.log("===== HOÀN THÀNH CẬP NHẬT THANH TOÁN =====\n");

    res.json({
      success: true,
      message: "Cập nhật thông tin thanh toán thành công",
      data: order
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

/**
 * Hoàn trả tồn kho khi hủy đơn hàng
 * @param {Object} order - Đơn hàng đã được hủy
 */
const restoreInventoryForOrder = async (order) => {
  try {
    console.log(`===== BẮT ĐẦU HOÀN TRẢ TỒN KHO =====`);
    console.log(`Đơn hàng: ${order._id}, Trạng thái: ${order.status}, Thanh toán: ${order.paymentStatus}`);
    
    // Chỉ hoàn trả tồn kho nếu đơn hàng đã thanh toán
    if (order.paymentStatus !== 'paid') {
      console.log(`Đơn hàng chưa thanh toán (${order.paymentStatus}), không cần hoàn trả tồn kho`);
      return;
    }
    
    if (!order.products || order.products.length === 0) {
      console.log('Không có sản phẩm nào để hoàn trả tồn kho');
      return;
    }
    
    console.log(`Đơn hàng có ${order.products.length} sản phẩm cần hoàn trả tồn kho`);
    
    // Xử lý từng sản phẩm trong đơn hàng
    for (const orderProduct of order.products) {
      console.log(`\n------ Xử lý hoàn trả sản phẩm: ${orderProduct.name} ------`);
      
      const productID = orderProduct.productID._id || orderProduct.productID.toString();
      const quantity = orderProduct.quantity || 1;
      
      console.log(`ID Sản phẩm: ${productID}`);
      console.log(`Số lượng cần hoàn trả: ${quantity}`);
      
      // Kiểm tra nếu có variantID
      const variantID = orderProduct.variantID?._id || orderProduct.variantID || null;
      
      if (variantID) {
        console.log(`Biến thể ID: ${variantID}`);
        
        // Tìm kiếm biến thể và hoàn trả
        const variant = await DetailsVariant.findById(variantID);
        
        if (variant) {
          console.log(`Tìm thấy biến thể: ${variant._id}`);
          console.log(`Tồn kho biến thể hiện tại: ${variant.inventory}`);
          
          // Cập nhật tồn kho: CỘNG số lượng để hoàn trả
          const oldInventory = variant.inventory;
          variant.inventory += quantity;
          
          // Lưu thay đổi
          await variant.save();
          
          console.log(`Đã hoàn trả tồn kho biến thể: ${oldInventory} -> ${variant.inventory}`);
        } else {
          console.log(`Không tìm thấy biến thể với ID: ${variantID}`);
        }
      } else {
        // Nếu không có biến thể, hoàn trả tồn kho sản phẩm chính
        const product = await Product.findById(productID);
        
        if (product) {
          console.log(`Tìm thấy sản phẩm: ${product.name}`);
          console.log(`Tồn kho sản phẩm hiện tại: ${product.inventory}`);
          
          // Cập nhật tồn kho: CỘNG số lượng để hoàn trả
          const oldInventory = product.inventory;
          product.inventory += quantity;
          
          // Lưu thay đổi
          await product.save();
          
          console.log(`Đã hoàn trả tồn kho sản phẩm: ${oldInventory} -> ${product.inventory}`);
        } else {
          console.log(`Không tìm thấy sản phẩm với ID: ${productID}`);
        }
      }
    }
    
    console.log(`===== HOÀN THÀNH HOÀN TRẢ TỒN KHO =====`);
  } catch (error) {
    console.error(`LỖI HOÀN TRẢ TỒN KHO: ${error.message}`);
    console.error(error.stack);
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
  updateOrderPayment,
  // Không export các hàm hỗ trợ vì chúng chỉ được sử dụng nội bộ trong controller
  // updateInventoryForOrder,
  // updateVariantInventory,
  // updateProductInventory
};