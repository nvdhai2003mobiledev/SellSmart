const orderService = require("../services/OrderService");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Employee = require("../models/Employee");
const DetailsVariant = require("../models/DetailsVariant");
const Variant = require("../models/Variant");
const Promotion = require("../models/Promotion");
const Inventory = require('../models/Inventory');

const createOrder = async (req, res) => {
  try {
    const {
      customerID,
      products,
      totalAmount,
      paymentMethod,
      paymentStatus,
      paidAmount,
      paymentDetails,
      shippingAddress,
      notes,
      status,
      employeeID,
      promotionID,
      originalAmount
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

    // Log thông tin thanh toán để debug
    console.log('=== THÔNG TIN THANH TOÁN ===');
    console.log(`Phương thức thanh toán: ${paymentMethod}`);
    console.log(`Trạng thái thanh toán: ${paymentStatus}`);
    console.log(`Số tiền đã thanh toán: ${paidAmount}`);
    console.log(`Chi tiết thanh toán:`, JSON.stringify(paymentDetails));
    
    // Log thông tin khuyến mãi để debug
    console.log('=== THÔNG TIN KHUYẾN MÃI ===');
    console.log(`Promotion ID: ${promotionID || 'Không có'}`);
    console.log(`Original Amount: ${originalAmount || 'Không có'}`);
    console.log(`Total Amount: ${totalAmount}`);
    
    // Tính giá gốc từ danh sách sản phẩm nếu không có originalAmount
    const calculatedTotal = products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    
    const finalOriginalAmount = originalAmount || calculatedTotal;
    
    console.log(`Calculated Total: ${calculatedTotal}`);
    console.log(`Final Original Amount: ${finalOriginalAmount}`);
    
    // Tính số tiền giảm giá
    const discountAmount = finalOriginalAmount - totalAmount;
    console.log(`Discount Amount: ${discountAmount}`);
    
    // Ensure all product IDs are valid MongoDB ObjectIDs
    const processedProducts = [];
    
    for (const product of products) {
      // Make sure productID is a valid ObjectID string
      if (!product.productID) {
        return res
          .status(400)
          .json({ success: false, message: `Sản phẩm ${product.name} thiếu ID sản phẩm` });
      }
      
      let productID = product.productID;
      
      // If productID is still in combined format (product-variant), split it
      if (typeof productID === 'string' && productID.includes('-')) {
        console.log(`Detected combined ID: ${productID}`);
        const parts = productID.split('-');
        productID = parts[0];
        if (!product.variantID && parts[1]) {
          product.variantID = parts[1];
        }
      }
      
      // Check if productID is a valid ObjectID
      if (!mongoose.Types.ObjectId.isValid(productID)) {
        return res
          .status(400)
          .json({ success: false, message: `ID sản phẩm không hợp lệ: ${productID}` });
      }
      
      // Process variantID if it exists
      let variantID = product.variantID;
      if (variantID && !mongoose.Types.ObjectId.isValid(variantID)) {
        return res
          .status(400)
          .json({ success: false, message: `ID biến thể không hợp lệ: ${variantID}` });
      }
      
      // Create the processed product object
      const processedProduct = {
        ...product,
        productID,
        variantID: variantID || undefined
      };
      
      processedProducts.push(processedProduct);
    }
    
    const orderObj = {
      orderID: `ORD-${Date.now()}`,
      customerID,
      products: processedProducts,
      totalAmount,
      originalAmount: finalOriginalAmount,
      paymentMethod: finalPaymentMethod,
      paymentStatus: paymentStatus || 'unpaid',
      status: status || 'pending',
      shippingAddress,
      employeeID,
      notes,
      paidAmount: paidAmount || 0,
      paymentDetails: paymentDetails || [],
    };
    
    // Thêm thông tin khuyến mãi nếu có
    if (promotionID) {
      orderObj.promotionID = promotionID;
      
      // Tìm thông tin khuyến mãi để lưu chi tiết
      try {
        const promotion = await Promotion.findById(promotionID);
        if (promotion) {
          orderObj.promotionDetails = {
            name: promotion.name,
            discount: promotion.discount,
            discountAmount: discountAmount > 0 ? discountAmount : 0
          };
          console.log(`Đã tìm thấy thông tin khuyến mãi: ${promotion.name}, ${promotion.discount}%, giảm ${discountAmount}`);
        }
      } catch (err) {
        console.error('Lỗi khi tìm thông tin khuyến mãi:', err);
      }
    }

    const newOrder = new Order(orderObj);
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
 * Cập nhật tồn kho cho đơn hàng và cập nhật số lượng trong bảng products
 * @param {Object} order - Đơn hàng đã được tạo
 */
const updateInventoryForOrder = async (order) => {
  try {
    console.log(`===== BẮT ĐẦU CẬP NHẬT TỒN KHO VÀ SẢN PHẨM =====`);
    console.log(`Đơn hàng: ${order._id}, Trạng thái: ${order.status}, Thanh toán: ${order.paymentStatus}`);
    
    if (!order.products || order.products.length === 0) {
      console.log('Không có sản phẩm nào để cập nhật tồn kho');
      return;
    }
    
    // Debugging: Log all products in the order
    console.log(`Tổng số sản phẩm trong đơn hàng: ${order.products.length}`);
    console.log('Chi tiết sản phẩm trong đơn hàng:');
    order.products.forEach((product, index) => {
      console.log(`--- Sản phẩm #${index + 1} ---`);
      console.log(`Tên: ${product.name}`);
      console.log(`ID: ${product.productID || 'Không có'}`);
      console.log(`Loại ID: ${typeof product.productID}`);
      if (typeof product.productID === 'object') {
        console.log(`Object ID: ${product.productID?._id || 'Null'}`);
      }
      console.log(`VariantID: ${product.variantID || 'Không có'}`);
      console.log(`Loại VariantID: ${product.variantID ? typeof product.variantID : 'N/A'}`);
      if (product.variantID && typeof product.variantID === 'object') {
        console.log(`Object VariantID: ${product.variantID._id || 'Null'}`);
      }
      console.log(`Product Code: ${product.product_code || 'Không có'}`);
      console.log(`Số lượng: ${product.quantity}`);
      console.log(`Thuộc tính:`, product.attributes || 'Không có');
    });
    
    // Import Inventory model if not already available
    const Inventory = mongoose.model('Inventory');
    if (!Inventory) {
      console.error('Không thể tìm thấy model Inventory');
      return;
    }

    // Xử lý từng sản phẩm trong đơn hàng
    for (const orderProduct of order.products) {
      console.log(`\n------ Xử lý sản phẩm: ${orderProduct.name} ------`);
      
      // Ensure productID is a string
      let productID = null;
      
      // Xử lý productID - luôn kiểm tra cả dạng string và object
      if (orderProduct.productID) {
        if (typeof orderProduct.productID === 'object' && orderProduct.productID?._id) {
          productID = orderProduct.productID._id.toString();
        } else if (typeof orderProduct.productID === 'string') {
          productID = orderProduct.productID;
        } else if (orderProduct.productID.toString) {
          productID = orderProduct.productID.toString();
        }
      }
      
      // Xử lý variantID - tương tự như productID
      let variantID = null;
      if (orderProduct.variantID) {
        if (typeof orderProduct.variantID === 'object' && orderProduct.variantID?._id) {
          variantID = orderProduct.variantID._id.toString();
        } else if (typeof orderProduct.variantID === 'string') {
          variantID = orderProduct.variantID;
        } else if (orderProduct.variantID.toString) {
          variantID = orderProduct.variantID.toString();
        }
      }
      
      // Check if productID is still null, try to find by product code or name
      if (!productID && !orderProduct.product_code && !orderProduct.name) {
        console.error(`Sản phẩm không có ID, mã hoặc tên hợp lệ, bỏ qua: ${JSON.stringify(orderProduct)}`);
        continue;
      }
      
      // Ensure we don't have a combined ID format (product-variant)
      if (productID && productID.includes('-')) {
        const parts = productID.split('-');
        productID = parts[0];
        // If variantID isn't set but we have it in the combined format, use it
        if (!variantID && parts[1]) {
          variantID = parts[1];
        }
      }
      
      const quantity = orderProduct.quantity || 1;
      
      console.log(`ID Sản phẩm: ${productID || 'Không có - sẽ tìm theo mã sản phẩm hoặc tên'}`);
      console.log(`ID Biến thể: ${variantID || 'Không có'}`);
      console.log(`Số lượng: ${quantity}`);
      
      // Validate variant ID is a valid MongoDB ObjectID
      if (variantID && !mongoose.Types.ObjectId.isValid(variantID)) {
        console.error(`Biến thể ID không hợp lệ: ${variantID}, bỏ qua biến thể`);
        variantID = null;
      }
      
      console.log(`Biến thể ID (đã xử lý): ${variantID || 'Không có'}`);
      
      try {
        // 1. Tìm kiếm và cập nhật sản phẩm trong bảng Product trước
        if (productID && mongoose.Types.ObjectId.isValid(productID)) {
          console.log(`Cập nhật sản phẩm trong database: ${productID}`);
          
          // Tìm sản phẩm trong database
          const product = await Product.findById(productID);
          
          if (product) {
            console.log(`Tìm thấy sản phẩm: ${product.name}`);
            console.log(`Tồn kho hiện tại (sản phẩm): ${product.inventory}`);
            console.log(`Có biến thể: ${product.hasVariants ? 'Có' : 'Không'}`);
            
            // Nếu sản phẩm có biến thể và có variantID
            if (product.hasVariants && variantID) {
              console.log(`Tìm biến thể ${variantID} trong sản phẩm`);
              
              // Tìm chi tiết biến thể trong sản phẩm
              let updated = false;
              
              if (product.detailsVariants && product.detailsVariants.length > 0) {
                for (let i = 0; i < product.detailsVariants.length; i++) {
                  const variant = product.detailsVariants[i];
                  
                  // Kiểm tra xem đây có phải là biến thể cần cập nhật không
                  if (variant._id.toString() === variantID) {
                    console.log(`Tìm thấy biến thể trong sản phẩm: ${variant._id}`);
                    console.log(`Tồn kho biến thể hiện tại: ${variant.inventory}`);
                    
                    // Cập nhật tồn kho biến thể
                    const oldInventory = variant.inventory;
                    if (variant.inventory >= quantity) {
                      product.detailsVariants[i].inventory -= quantity;
                      
                      // Cập nhật tổng tồn kho của sản phẩm
                      if (product.inventory) {
                        product.inventory -= quantity;
                      }
                      
                      await product.save();
                      
                      console.log(`Đã cập nhật tồn kho biến thể trong sản phẩm: ${oldInventory} -> ${product.detailsVariants[i].inventory}`);
                      console.log(`Tổng tồn kho sản phẩm sau cập nhật: ${product.inventory}`);
                      updated = true;
                    } else {
                      console.log(`Cảnh báo: Không đủ tồn kho biến thể trong sản phẩm (cần ${quantity}, hiện có ${variant.inventory})`);
                    }
                    break;
                  }
                }
              }
              
              if (!updated) {
                console.log(`Không tìm thấy biến thể ${variantID} trong sản phẩm, thử cập nhật tồn kho tổng`);
                // Nếu không tìm thấy biến thể cụ thể, cập nhật tồn kho tổng
                if (product.inventory && product.inventory >= quantity) {
                  product.inventory -= quantity;
                  await product.save();
                  console.log(`Đã cập nhật tồn kho tổng sản phẩm: ${product.inventory + quantity} -> ${product.inventory}`);
                } else {
                  console.log(`Cảnh báo: Không đủ tồn kho sản phẩm (cần ${quantity}, hiện có ${product.inventory || 0})`);
                }
              }
            } 
            // Sản phẩm không có biến thể, cập nhật trực tiếp tồn kho
            else if (!product.hasVariants && product.inventory) {
              if (product.inventory >= quantity) {
                const oldInventory = product.inventory;
                product.inventory -= quantity;
                await product.save();
                console.log(`Đã cập nhật tồn kho sản phẩm: ${oldInventory} -> ${product.inventory}`);
              } else {
                console.log(`Cảnh báo: Không đủ tồn kho sản phẩm (cần ${quantity}, hiện có ${product.inventory})`);
              }
            }
          } else {
            console.log(`Không tìm thấy sản phẩm với ID: ${productID}`);
          }
        }
        
        // 2. Tiếp tục cập nhật trong bảng Inventory
        // Tạo query để tìm sản phẩm trong kho bằng nhiều cách khác nhau
        const query = { $or: [] };
        
        // Add product ID to query if available
        if (productID && mongoose.Types.ObjectId.isValid(productID)) {
          query.$or.push({ _id: productID });
          console.log(`Thêm tìm kiếm theo ID: ${productID}`);
        }
        
        // Add product code to query if available
        if (orderProduct.product_code) {
          query.$or.push({ product_code: orderProduct.product_code });
          console.log(`Thêm tìm kiếm theo mã sản phẩm: ${orderProduct.product_code}`);
        }
        
        // Thêm điều kiện tìm kiếm theo tên nếu có
        if (orderProduct.name) {
          query.$or.push({ product_name: orderProduct.name });
          console.log(`Thêm tìm kiếm theo tên: ${orderProduct.name}`);
        }
        
        // Check if query has any search conditions
        if (query.$or.length === 0) {
          console.error(`Không có điều kiện tìm kiếm hợp lệ cho sản phẩm: ${orderProduct.name}`);
          continue;
        }
        
        console.log('Tìm kiếm sản phẩm trong kho với query:', JSON.stringify(query));
        
        let inventoryItem = await Inventory.findOne(query);
        
        if (!inventoryItem) {
          console.log('Không tìm thấy sản phẩm trong kho. Bỏ qua sản phẩm này.');
          continue;
        }
        
        console.log(`Tìm thấy sản phẩm trong kho: ${inventoryItem.product_name}`);
        console.log(`Tồn kho hiện tại: ${inventoryItem.total_quantity}`);
        console.log(`Có biến thể: ${inventoryItem.hasVariants ? 'Có' : 'Không'}`);

        if (inventoryItem.hasVariants && inventoryItem.variantDetails && inventoryItem.variantDetails.length > 0 && variantID) {
          console.log(`Sản phẩm có biến thể, tìm biến thể ID: ${variantID}`);
          
          // Tìm biến thể dựa vào ID - Phương pháp 1: Tìm chính xác theo _id
          let variantIndex = inventoryItem.variantDetails.findIndex(v => 
            v._id && v._id.toString() === variantID
          );
          
          // Phương pháp 2: Tìm theo trường _id trong dữ liệu
          if (variantIndex < 0) {
            variantIndex = inventoryItem.variantDetails.findIndex(v => 
              v._id && v._id.toString() === variantID
            );
          }
          
          // Phương pháp 3: Tìm theo trường variantId nếu có
          if (variantIndex < 0) {
            variantIndex = inventoryItem.variantDetails.findIndex(v => 
              v.variantId && v.variantId.toString() === variantID
            );
          }
          
          // Phương pháp 4: Tìm theo bất kỳ trường nào có thể là id 
          if (variantIndex < 0) {
            for (let i = 0; i < inventoryItem.variantDetails.length; i++) {
              const variant = inventoryItem.variantDetails[i];
              for (const key in variant) {
                if (variant[key] && variant[key].toString && variant[key].toString() === variantID) {
                  variantIndex = i;
                  console.log(`Tìm thấy biến thể qua trường: ${key}`);
                  break;
                }
              }
              if (variantIndex >= 0) break;
            }
          }
          
          if (variantIndex >= 0) {
            const variant = inventoryItem.variantDetails[variantIndex];
            console.log(`Tìm thấy biến thể: ${variantIndex}`);
            console.log(`Tồn kho biến thể hiện tại: ${variant.quantity}`);
            
            // Kiểm tra tồn kho
            if (variant.quantity < quantity) {
              console.log(`Cảnh báo: Không đủ tồn kho (cần ${quantity}, hiện có ${variant.quantity})`);
              continue;
            }
            
            // Cập nhật tồn kho biến thể
            const oldQuantity = variant.quantity;
            inventoryItem.variantDetails[variantIndex].quantity -= quantity;
            
            // Cập nhật tổng số lượng của sản phẩm
            inventoryItem.total_quantity -= quantity;
            
            // Cập nhật tổng giá (recalculate tổng giá để đảm bảo đúng với các biến thể)
            inventoryItem.total_price = inventoryItem.variantDetails.reduce(
              (sum, v) => sum + (v.price * v.quantity),
              0
            );
            
            // Lưu thay đổi
            await inventoryItem.save();
            
            console.log(`Đã cập nhật tồn kho biến thể: ${oldQuantity} -> ${inventoryItem.variantDetails[variantIndex].quantity}`);
            console.log(`Tổng tồn kho sau cập nhật: ${inventoryItem.total_quantity}`);
          } else {
            // Nếu không tìm thấy biến thể theo ID, thử tìm theo thuộc tính...
            console.log(`Không tìm thấy biến thể với ID ${variantID}, thử tìm theo thuộc tính...`);
            
            if (orderProduct.attributes && orderProduct.attributes.length > 0) {
              // Tạo một bản đồ thuộc tính đơn giản cho dễ so sánh
              const attributeMap = {};
              orderProduct.attributes.forEach(attr => {
                if (attr.name && attr.value) {
                  let value = attr.value;
                  if (Array.isArray(value)) {
                    value = value[0]; // Lấy giá trị đầu tiên nếu là mảng
                  }
                  attributeMap[attr.name.toLowerCase()] = value.toString().toLowerCase();
                }
              });
              
              console.log(`Bản đồ thuộc tính từ đơn hàng:`, attributeMap);
              
              // Tìm biến thể phù hợp với thuộc tính
              let bestMatch = null;
              let bestMatchScore = 0;
              
              inventoryItem.variantDetails.forEach((variant, idx) => {
                let matchScore = 0;
                
                // Tạo bản đồ thuộc tính của biến thể
                const variantAttrMap = {};
                
                // Xử lý nhiều định dạng thuộc tính có thể có
                if (variant.attributes && typeof variant.attributes === 'object') {
                  // Format 1: { Color: "Red", Size: "L" }
                  Object.entries(variant.attributes).forEach(([key, value]) => {
                    variantAttrMap[key.toLowerCase()] = value.toString().toLowerCase();
                  });
                }
                
                // Nếu có thuộc tính trong biến thể, kiểm tra sự khớp
                if (Object.keys(variantAttrMap).length > 0) {
                  // Kiểm tra từng thuộc tính trong đơn hàng
                  for (const [key, value] of Object.entries(attributeMap)) {
                    for (const [varKey, varValue] of Object.entries(variantAttrMap)) {
                      // Kiểm tra tên thuộc tính
                      const keyMatch = 
                        key === varKey || 
                        key.includes(varKey) || 
                        varKey.includes(key) ||
                        // Đặc biệt xử lý cho một số tên thuộc tính thông dụng
                        (key === 'màu sắc' && (varKey === 'color' || varKey === 'màu')) ||
                        (key === 'dung lượng' && (varKey === 'capacity' || varKey === 'size'));
                      
                      // Kiểm tra giá trị thuộc tính
                      const valueMatch = 
                        value === varValue ||
                        value.includes(varValue) ||
                        varValue.includes(value);
                      
                      if (keyMatch && valueMatch) {
                        matchScore += 2; // Khớp cả tên và giá trị
                      } else if (keyMatch) {
                        matchScore += 1; // Chỉ khớp tên
                      } else if (valueMatch) {
                        matchScore += 0.5; // Chỉ khớp giá trị
                      }
                    }
                  }
                }
                
                console.log(`Biến thể #${idx} - Điểm khớp: ${matchScore}`);
                
                if (matchScore > bestMatchScore) {
                  bestMatchScore = matchScore;
                  bestMatch = { index: idx, variant };
                }
              });
              
              if (bestMatch && bestMatchScore > 0) {
                console.log(`Tìm thấy biến thể phù hợp nhất: ${bestMatch.index} với điểm ${bestMatchScore}`);
                
                const variant = bestMatch.variant;
                
                // Kiểm tra tồn kho
                if (variant.quantity < quantity) {
                  console.log(`Cảnh báo: Không đủ tồn kho (cần ${quantity}, hiện có ${variant.quantity})`);
                  continue;
                }
                
                // Cập nhật tồn kho biến thể
                const oldQuantity = variant.quantity;
                inventoryItem.variantDetails[bestMatch.index].quantity -= quantity;
                
                // Cập nhật tổng số lượng của sản phẩm
                inventoryItem.total_quantity -= quantity;
                
                // Cập nhật tổng giá
                inventoryItem.total_price = inventoryItem.variantDetails.reduce(
                  (sum, v) => sum + (v.price * v.quantity),
                  0
                );
                
                // Lưu thay đổi
                await inventoryItem.save();
                
                console.log(`Đã cập nhật tồn kho biến thể: ${oldQuantity} -> ${inventoryItem.variantDetails[bestMatch.index].quantity}`);
                console.log(`Tổng tồn kho sau cập nhật: ${inventoryItem.total_quantity}`);
              } else {
                console.log(`Không tìm thấy biến thể phù hợp với thuộc tính, sử dụng biến thể đầu tiên...`);
                
                // Sử dụng biến thể đầu tiên nếu có
                if (inventoryItem.variantDetails.length > 0) {
                  const firstVariant = inventoryItem.variantDetails[0];
                  
                  if (firstVariant.quantity < quantity) {
                    console.log(`Cảnh báo: Không đủ tồn kho (cần ${quantity}, hiện có ${firstVariant.quantity})`);
                    continue;
                  }
                  
                  // Cập nhật tồn kho biến thể
                  const oldQuantity = firstVariant.quantity;
                  inventoryItem.variantDetails[0].quantity -= quantity;
                  
                  // Cập nhật tổng số lượng của sản phẩm
                  inventoryItem.total_quantity -= quantity;
                  
                  // Cập nhật tổng giá
                  inventoryItem.total_price = inventoryItem.variantDetails.reduce(
                    (sum, v) => sum + (v.price * v.quantity),
                    0
                  );
                  
                  // Lưu thay đổi
                  await inventoryItem.save();
                  
                  console.log(`Đã cập nhật tồn kho biến thể đầu tiên: ${oldQuantity} -> ${inventoryItem.variantDetails[0].quantity}`);
                  console.log(`Tổng tồn kho sau cập nhật: ${inventoryItem.total_quantity}`);
                }
              }
            }
          }
        } else {
          // Sản phẩm không có biến thể hoặc không tìm thấy biến thể, cập nhật trực tiếp tổng tồn kho
          console.log(`Sản phẩm không có biến thể hoặc không tìm được biến thể, cập nhật trực tiếp tổng tồn kho`);
          
          try {
            // Cập nhật trực tiếp vào MongoDB
            const updateResult = await Inventory.updateOne(
              { _id: inventoryItem._id },
              { $inc: { 'total_quantity': quantity } }
            );
            
            console.log(`Đã hoàn trả ${quantity} vào tổng tồn kho`);
            console.log(`Kết quả cập nhật: ${JSON.stringify(updateResult)}`);
          } catch (error) {
            console.error(`Lỗi khi cập nhật tổng tồn kho: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`Lỗi khi tìm kiếm sản phẩm trong kho: ${error.message}`);
      }
    }
    
    console.log(`===== KẾT THÚC CẬP NHẬT TỒN KHO VÀ SẢN PHẨM =====`);
  } catch (error) {
    console.error(`Lỗi khi cập nhật tồn kho và sản phẩm: ${error.message}`);
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
        
        return; // Thoát sớm vì đã xử lý xong xong
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
    console.log('Fetching mobile orders with query params:', req.query);
    
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const query = {};
    
    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    } else if (req.query.excludeStatus) {
      // Exclude specific status (like 'draft')
      query.status = { $ne: req.query.excludeStatus };
    }
    
    // Payment status filter
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    console.log('Query filters:', query);
    
    // Count total matching documents for pagination
    const totalOrders = await Order.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);
    
    // Fetch filtered and paginated orders
    const orders = await Order.find(query)
      .populate('customerID', 'fullName phoneNumber email address')
      .populate('employeeID', 'fullName position')
      .populate('products.productID', 'name price')
      .populate('promotionID', 'name discount maxDiscount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Found ${orders.length} orders (page ${page}/${totalPages}, total: ${totalOrders})`);
    
    // Transform orders for mobile display
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
      promotionDetails: order.promotionDetails || null,
      originalAmount: order.originalAmount || order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }));
    
    res.json({
      success: true,
      count: transformedOrders.length,
      data: transformedOrders,
      totalOrders,
      totalPages,
      currentPage: page
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
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // Get filter parameters from query
    const filters = {
      orderID: req.query.orderID || '',
      customerName: req.query.customerName || '',
      phone: req.query.phone || '',
      status: req.query.status || '',
      paymentStatus: req.query.paymentStatus || '',
      fromDate: req.query.fromDate || '',
      toDate: req.query.toDate || ''
    };
    
    // Get paginated orders with filters
    const { orders, total, totalPages } = await orderService.getPaginatedOrders(page, pageSize, filters);
    
    // Log pagination info
    console.log(`Rendering orders page ${page} of ${totalPages}, showing ${orders.length} of ${total} orders`);
    
    // Render the page with pagination data
    res.render("dashboard/orders", { 
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      },
      filters,
      page: "orders",
      title: "Quản lý đơn hàng"
    });
  } catch (error) {
    console.error("Lỗi khi render trang đơn hàng:", error);
    res.status(500).send("Lỗi server khi hiển thị danh sách đơn hàng");
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

/**
 * Xử lý logic thay đổi trạng thái đơn hàng
 */
const processOrderStatusChange = async (orderId, newStatus, cancelReason) => {
  try {
    // Log thông tin xử lý
    console.log(`===== XỬ LÝ THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG =====`);
    console.log(`Đơn hàng: ${orderId}, Trạng thái mới: ${newStatus}`);
    
    // Lấy thông tin đơn hàng hiện tại - KHÔNG sử dụng populate để giữ nguyên cấu trúc ID
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error(`Không tìm thấy đơn hàng: ${orderId}`);
      throw new Error('Không tìm thấy đơn hàng');
    }
    
    // Ghi log thông tin sản phẩm để debug
    if (order.products && order.products.length > 0) {
      console.log('Chi tiết sản phẩm trong đơn hàng:');
      order.products.forEach((product, index) => {
        console.log(`Sản phẩm #${index + 1}: ${product.name}`);
        console.log(`ProductID: ${product.productID}`);
        console.log(`VariantID: ${product.variantID || 'Không có'}`);
        console.log(`Số lượng: ${product.quantity}`);
        console.log(`Thuộc tính: ${product.attributes ? product.attributes.length : 0} thuộc tính`);
      });
    }
    
    // Khôi phục tồn kho nếu trạng thái chuyển từ processing/shipping -> canceled
    if (newStatus === 'canceled' && (order.status === 'processing' || order.status === 'shipping')) {
      console.log(`Đơn hàng ${orderId} chuyển từ ${order.status} sang ${newStatus}, sẽ khôi phục tồn kho`);
      await restoreInventoryForOrder(order);
    }
    
    // Cập nhật tồn kho nếu trạng thái chuyển sang processing và đã thanh toán đủ
    if (newStatus === 'processing' && order.status !== 'processing' && order.paymentStatus === 'paid') {
      console.log(`Đơn hàng ${orderId} chuyển sang trạng thái processing và đã thanh toán, sẽ cập nhật tồn kho`);
      await updateInventoryForOrder(order);
    }
    
    // Cập nhật trạng thái đơn hàng trong database
    const updateData = { status: newStatus };
    
    // Thêm lý do hủy nếu cần
    if (newStatus === 'canceled' && cancelReason) {
      updateData.cancelReason = cancelReason;
      console.log(`Lý do hủy đơn: ${cancelReason}`);
    }
    
    // Cập nhật đơn hàng - KHÔNG sử dụng populate để tránh thay đổi cấu trúc ID
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
    
    // Kiểm tra lại thông tin sản phẩm sau khi cập nhật
    if (updatedOrder.products && updatedOrder.products.length > 0) {
      console.log('Chi tiết sản phẩm sau khi cập nhật:');
      updatedOrder.products.forEach((product, index) => {
        console.log(`Sản phẩm #${index + 1}: ${product.name}`);
        console.log(`ProductID: ${product.productID}`);
        console.log(`VariantID: ${product.variantID || 'Không có'}`);
      });
    }
    
    console.log(`===== KẾT THÚC XỬ LÝ THAY ĐỔI TRẠNG THÁI =====`);
    
    return updatedOrder;
  } catch (error) {
    console.error(`Lỗi khi xử lý thay đổi trạng thái đơn hàng: ${error.message}`);
    console.error(error);
    throw error;
  }
};

const updateOrderPayment = async (req, res) => {
  const orderId = req.params.id;
  const { paymentMethod, paymentStatus, amount, status } = req.body;

  console.log(`===== REQUEST: Cập nhật thanh toán đơn hàng ${orderId} =====`);
  console.log(`Dữ liệu nhận được:`, req.body);

  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error(`OrderID không hợp lệ: ${orderId}`);
      return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ!' });
    }

    // Tìm đơn hàng cần cập nhật với đầy đủ thông tin sản phẩm
    // QUAN TRỌNG: KHÔNG dùng populate vì nó có thể làm thay đổi cấu trúc productID và variantID
    const order = await Order.findById(orderId);

    if (!order) {
      console.error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }

    console.log(`Tìm thấy đơn hàng:`, {
      id: order._id,
      orderID: order.orderID,
      totalAmount: order.totalAmount,
      currentPaymentStatus: order.paymentStatus,
      currentPaidAmount: order.paidAmount || 0
    });

    // Log thông tin sản phẩm để kiểm tra
    if (order.products && order.products.length > 0) {
      console.log('Chi tiết sản phẩm trong đơn hàng:');
      order.products.forEach((product, index) => {
        console.log(`--- Sản phẩm #${index + 1} ---`);
        console.log(`Tên: ${product.name}`);
        console.log(`ProductID: ${product.productID}`);
        console.log(`VariantID: ${product.variantID || 'Không có'}`);
      });
    }

    // Chi tiết thanh toán hiện tại hoặc mảng rỗng nếu chưa có
    const paymentDetails = order.paymentDetails || [];
    
    // Tính toán số tiền đã thanh toán
    let currentPaidAmount = order.paidAmount || 0;
    
    // Thêm thông tin thanh toán mới
    if (amount) {
      currentPaidAmount += amount;
      paymentDetails.push({
        method: paymentMethod,
        amount: amount,
        date: new Date()
      });
      
      console.log(`Thêm thanh toán mới: ${paymentMethod}, Số tiền: ${amount}`);
    }
    
    console.log(`Số tiền đã thanh toán sau khi cập nhật: ${currentPaidAmount}/${order.totalAmount}`);
    
    // Xác định trạng thái thanh toán sau khi cập nhật
    let updatedPaymentStatus = paymentStatus;
    let updatedOrderStatus = status || order.status;
    
    // Tự động chuyển sang trạng thái đã thanh toán đủ nếu số tiền đã thanh toán bằng hoặc vượt quá tổng tiền đơn hàng
    if (currentPaidAmount >= order.totalAmount) {
      updatedPaymentStatus = 'paid';
      console.log(`Đơn hàng đã được thanh toán đủ, chuyển trạng thái thành "paid"`);
      
      // Nếu đơn hàng ở trạng thái 'pending' và đã thanh toán đủ, cập nhật thành 'processing'
      if (order.status === 'pending') {
        updatedOrderStatus = 'processing';
        console.log(`Đơn hàng đã thanh toán đủ, nâng cấp trạng thái từ 'pending' thành 'processing'`);
      }
    } else if (currentPaidAmount > 0) {
      updatedPaymentStatus = 'partpaid';
      console.log(`Đơn hàng thanh toán một phần, trạng thái là "partpaid"`);
    }
    
    // Cập nhật đơn hàng với thông tin mới
    const updateData = {
      paymentMethod,
      paymentStatus: updatedPaymentStatus,
      paidAmount: currentPaidAmount,
      paymentDetails: paymentDetails
    };
    
    // Chỉ cập nhật trạng thái nếu nó thay đổi
    if (updatedOrderStatus !== order.status) {
      updateData.status = updatedOrderStatus;
      console.log(`Cập nhật trạng thái đơn hàng từ ${order.status} thành ${updatedOrderStatus}`);
    }
    
    console.log('Dữ liệu cập nhật:', updateData);
    
    // Cập nhật đơn hàng nhưng KHÔNG dùng populate để giữ nguyên cấu trúc ID
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    // Kiểm tra lại thông tin sản phẩm sau khi cập nhật
    console.log('Chi tiết sản phẩm sau khi cập nhật:');
    if (updatedOrder.products && updatedOrder.products.length > 0) {
      updatedOrder.products.forEach((product, index) => {
        console.log(`--- Sản phẩm #${index + 1} ---`);
        console.log(`Tên: ${product.name}`);
        console.log(`ProductID: ${product.productID}`);
        console.log(`VariantID: ${product.variantID || 'Không có'}`);
      });
    }

    console.log('Đơn hàng đã được cập nhật thành công:', {
      id: updatedOrder._id,
      orderID: updatedOrder.orderID,
      paymentStatus: updatedOrder.paymentStatus,
      status: updatedOrder.status,
      paidAmount: updatedOrder.paidAmount,
      paymentDetails: updatedOrder.paymentDetails
    });

    // Thêm đoạn code này: Nếu đơn hàng vừa được chuyển sang trạng thái processing và đã thanh toán đủ, cập nhật tồn kho
    const shouldUpdateInventory = 
      (updatedOrderStatus === 'processing' && updatedPaymentStatus === 'paid' && order.status !== 'processing') ||
      (order.status === 'processing' && order.paymentStatus !== 'paid' && updatedPaymentStatus === 'paid');
    
    if (shouldUpdateInventory) {
      console.log('Đơn hàng vừa chuyển sang trạng thái processing và đã thanh toán đủ, đang cập nhật tồn kho...');
      try {
        await updateInventoryForOrder(updatedOrder);
      } catch (inventoryError) {
        console.error('Lỗi khi cập nhật tồn kho:', inventoryError);
        // Vẫn trả về success mặc dù có lỗi khi cập nhật tồn kho
        // Nhưng ghi log để theo dõi
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thanh toán thành công!',
      order: {
        _id: updatedOrder._id,
        orderID: updatedOrder.orderID,
        paymentStatus: updatedOrder.paymentStatus,
        status: updatedOrder.status,
        paidAmount: updatedOrder.paidAmount,
        totalAmount: updatedOrder.totalAmount,
        paymentMethod: updatedOrder.paymentMethod
      }
    });
  } catch (error) {
    console.error(`Lỗi khi cập nhật thanh toán đơn hàng ${orderId}:`, error);
    return res.status(500).json({ success: false, message: `Lỗi: ${error.message}` });
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

// Thêm hàm mới để lấy thống kê thanh toán
const getPaymentStats = async (req, res) => {
    try {
        console.log('\n===== FETCHING PAYMENT STATISTICS =====');
        
        // Lấy tất cả đơn hàng không bị hủy
        const orders = await Order.find({ status: { $ne: 'canceled' } });
        console.log(`Found ${orders.length} non-canceled orders`);
        
        // Khởi tạo đối tượng thống kê
        const stats = {
            methods: {
                cash: 0,
                bank: 0,
                eWallet: 0
            },
            status: {
                paid: 0,
                unpaid: 0
            }
        };
        
        // Tính toán thống kê
        orders.forEach(order => {
            console.log(`\nProcessing order ${order.orderID}:`);
            console.log(`- Payment Status: ${order.paymentStatus}`);
            console.log(`- Payment Method: ${order.paymentMethod}`);
            console.log(`- Total Amount: ${order.totalAmount}`);
            
            // Thống kê theo phương thức thanh toán
            if (order.paymentStatus === 'paid' && order.totalAmount) {
                switch (order.paymentMethod?.toLowerCase()) {
                    case 'cash':
                        stats.methods.cash += order.totalAmount;
                        console.log(`Added ${order.totalAmount} to cash payments`);
                        break;
                    case 'credit card':
                    case 'debit card':
                    case 'bank':
                    case 'bank transfer':
                        stats.methods.bank += order.totalAmount;
                        console.log(`Added ${order.totalAmount} to bank payments`);
                        break;
                    case 'e-wallet':
                    case 'ewallet':
                    case 'momo':
                    case 'zalopay':
                        stats.methods.eWallet += order.totalAmount;
                        console.log(`Added ${order.totalAmount} to e-wallet payments`);
                        break;
                    default:
                        console.log(`Unknown payment method: ${order.paymentMethod}`);
                }
            }
            
            // Thống kê theo trạng thái thanh toán
            if (order.paymentStatus === 'paid') {
                stats.status.paid++;
            } else if (order.paymentStatus === 'unpaid') {
                stats.status.unpaid++;
            }
        });
        
        console.log('\nFinal Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        console.log('===== END PAYMENT STATISTICS =====\n');
        
        res.json({
            status: 'Ok',
            data: stats
        });
    } catch (error) {
        console.error('Error getting payment statistics:', error);
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Thêm hàm mới để lấy phân bố đơn hàng
const getOrderDistribution = async (req, res) => {
    try {
        console.log('\n===== FETCHING ORDER DISTRIBUTION =====');
        
        // Get date range from query parameters
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        } else {
            // Default to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = today;
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            endDate = tomorrow;
            console.log(`Using default date range (today): ${startDate.toISOString()} to ${endDate.toISOString()}`);
        }

        // Get orders within the date range
        const orders = await Order.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        });
        
        console.log(`Found ${orders.length} orders for the selected period`);

        // Initialize counters for the three order statuses
        const stats = {
            processing: 0,
            canceled: 0,
            pending: 0
        };

        // Count orders by status
        orders.forEach(order => {
            console.log(`Order ${order.orderID}: status = ${order.status}`);
            if (order.status in stats) {
                stats[order.status]++;
            }
        });

        // Calculate total based on just the three statuses
        const total = stats.processing + stats.canceled + stats.pending;

        // Calculate percentages and format to one decimal place
        const distribution = {
            processing: {
                count: stats.processing,
                percentage: total > 0 ? ((stats.processing / total) * 100).toFixed(1) : "0.0"
            },
            canceled: {
                count: stats.canceled,
                percentage: total > 0 ? ((stats.canceled / total) * 100).toFixed(1) : "0.0"
            },
            pending: {
                count: stats.pending,
                percentage: total > 0 ? ((stats.pending / total) * 100).toFixed(1) : "0.0"
            },
            total: total
        };

        console.log('Order distribution for selected period:', distribution);
        console.log('===== END ORDER DISTRIBUTION =====\n');

        return res.status(200).json({
            status: "Ok",
            data: distribution
        });

    } catch (error) {
        console.error('Error in getOrderDistribution:', error);
        return res.status(500).json({
            status: "Error",
            message: "Lỗi khi lấy phân bố đơn hàng: " + error.message
        });
    }
};

const getEmployeePerformance = async (req, res) => {
    try {
        console.log('\n===== FETCHING EMPLOYEE PERFORMANCE DATA =====');
        
        // Get the date range from query parameters
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        } else {
            // Default to current month
            endDate = new Date();
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            console.log(`Using default date range (month): ${startDate.toISOString()} to ${endDate.toISOString()}`);
        }
        
        console.log(`Analyzing performance from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Get all employees first
        const employees = await Employee.find()
            .populate('userId', 'fullName username avatar')
            .lean();

        // Get all users with employee role
        const employeeUsers = await mongoose.model('User').find({ role: 'employee' }).lean();
        
        console.log(`Found ${employees.length} employees and ${employeeUsers.length} employee users`);

        // Create a map of employee and user data for quick lookup
        const employeeMap = new Map();
        
        // Add data from Employee collection
        employees.forEach(employee => {
            const id = employee._id.toString();
            employeeMap.set(id, {
                id: id,
                fullName: employee.userId ? employee.userId.fullName : null,
                position: employee.position || 'Nhân viên',
                avatar: employee.userId ? employee.userId.avatar : null,
                username: employee.userId ? employee.userId.username : null,
                source: 'employee'
            });
            
            // Also map by userId if available
            if (employee.userId && employee.userId._id) {
                employeeMap.set(employee.userId._id.toString(), {
                    id: id,
                    fullName: employee.userId.fullName,
                    position: employee.position || 'Nhân viên',
                    avatar: employee.userId.avatar,
                    username: employee.userId.username,
                    source: 'employee'
                });
            }
        });
        
        // Add data from User collection
        employeeUsers.forEach(user => {
            const id = user._id.toString();
            // Only add if not already in the map from Employee collection
            if (!employeeMap.has(id)) {
                employeeMap.set(id, {
                    id: id,
                    fullName: user.fullName || user.username,
                    position: 'Nhân viên',
                    avatar: user.avatar,
                    username: user.username,
                    source: 'user'
                });
            }
        });

        console.log(`Created lookup map with ${employeeMap.size} employee entries`);

        // Get all completed and paid orders within date range
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'canceled' },
            paymentStatus: 'paid'
        });

        console.log(`Found ${orders.length} valid paid orders in date range`);

        // Initialize tracking for stats
        const performanceStats = new Map();
        let totalRevenue = 0;
        let totalOrders = 0;

        // Process orders
        orders.forEach(order => {
            if (!order.employeeID) {
                console.log(`Order ${order.orderID || order._id} has no employeeID, skipping...`);
                return;
            }
            
            // Handle the case where employeeID can be an ObjectId or a string
            let employeeId = '';
            
            if (typeof order.employeeID === 'object' && order.employeeID !== null) {
                employeeId = order.employeeID.toString();
            } else if (typeof order.employeeID === 'string') {
                employeeId = order.employeeID;
            } else {
                console.log(`Unexpected employeeID format in order ${order.orderID || order._id}: ${typeof order.employeeID}`);
                return;
            }
            
            console.log(`Processing order ${order.orderID || order._id} with employeeID: ${employeeId}`);
            
            // Try to find employee in our map
            let employeeInfo = employeeMap.get(employeeId);
            
            // If not found directly, try to find by different ID formats
            if (!employeeInfo) {
                if (employeeId.includes('ObjectId')) {
                    const cleanId = employeeId.replace(/ObjectId\(['"](.+)['"]\)/g, '$1');
                    employeeInfo = employeeMap.get(cleanId);
                    console.log(`Tried cleaning ObjectId: ${employeeId} -> ${cleanId}, found: ${Boolean(employeeInfo)}`);
                }
            }
            
            // If still not found, create a basic entry
            if (!employeeInfo) {
                console.log(`Employee ${employeeId} not found in map, creating basic entry...`);
                employeeInfo = {
                    id: employeeId,
                    fullName: 'Nhân viên không xác định',
                    position: 'Nhân viên',
                    avatar: null,
                    username: null,
                    source: 'unknown'
                };
            }
            
            // Get or create stats for this employee
            let stats = performanceStats.get(employeeId);
            if (!stats) {
                stats = {
                    employeeId: employeeId,
                    fullName: employeeInfo.fullName,
                    position: employeeInfo.position,
                    avatar: employeeInfo.avatar,
                    username: employeeInfo.username,
                    orderCount: 0,
                    totalRevenue: 0,
                    customers: new Set()
                };
                performanceStats.set(employeeId, stats);
            }
            
            // Update stats
            stats.orderCount++;
            stats.totalRevenue += order.totalAmount || 0;
            if (order.customerID) {
                stats.customers.add(typeof order.customerID === 'object' ? 
                    order.customerID.toString() : order.customerID);
            }
            
            // Update totals
            totalRevenue += order.totalAmount || 0;
            totalOrders++;
        });
        
        // Convert to array for response
        let performanceData = Array.from(performanceStats.values())
            .map(stats => {
                // Calculate derived stats
                const orderCount = stats.orderCount;
                const totalRevenue = stats.totalRevenue;
                const contribution = totalRevenue > 0 ? 
                    (stats.totalRevenue / totalRevenue * 100).toFixed(1) : "0.0";
                
                return {
                    employeeId: stats.employeeId,
                    fullName: stats.fullName,
                    username: stats.username,
                    position: stats.position,
                    avatar: stats.avatar,
                    orderCount: orderCount,
                    totalRevenue: totalRevenue,
                    customerCount: stats.customers.size,
                    performance: {
                        orders: orderCount,
                        revenue: totalRevenue,
                        averageOrder: orderCount > 0 ? totalRevenue / orderCount : 0,
                        contribution: contribution
                    }
                };
            })
            .filter(employee => employee.orderCount > 0)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        console.log(`Generated performance data for ${performanceData.length} employees`);
        
        // Return the result
        return res.json({
            status: 'Ok',
            data: {
                summary: {
                    totalRevenue,
                    totalOrders,
                    activeEmployees: performanceData.length,
                    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                    period: {
                        start: startDate,
                        end: endDate
                    }
                },
                employees: performanceData
            }
        });
    } catch (error) {
        console.error('Error in getEmployeePerformance:', error);
        return res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

const getDailyRevenue = async (req, res) => {
  try {
    console.log('Revenue request with query params:', req.query);
    
    // Extract date range and period from query parameters
    let startDate, endDate;
    const { period = 'day' } = req.query;
    
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
      console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } else {
      // Use default date range based on period
      const now = new Date();
      
      switch (period) {
        case 'day':
          // Default to today
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          // Default to this week
          const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday, 6 = Sunday
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday, 0, 0, 0);
          endDate = new Date(now);
          break;
        case 'month':
          // Default to this month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(now);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }
      
      console.log(`Using default date range for ${period}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }
    
    console.log(`Fetching revenue data for period: ${period}`);
    
    let labels = [];
    let revenue = [];
    let totalRevenue = 0;
    let totalOrders = 0;
    let orders = [];
    
    // Fetch orders for the selected date range
    const baseQuery = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: 'canceled' },
      paymentStatus: 'paid'
    };
    
    orders = await Order.find(baseQuery).sort('createdAt');
    
    console.log(`Found ${orders.length} orders for the selected period`);
    
    switch (period) {
      case 'day':
        // Daily view: show hourly data from 7am to 9pm (21:00)
        labels = Array.from({ length: 15 }, (_, i) => `${i + 7}h`);
        revenue = Array(15).fill(0);
        
        // Process orders by hour, only between 7am and 9pm
        orders.forEach(order => {
          const hour = order.createdAt.getHours();
          if (hour >= 7 && hour < 21) {
            revenue[hour - 7] += order.totalAmount;
          }
        });
        break;
        
      case 'week':
        // Weekly view: show daily data
        const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
        labels = dayNames;
        revenue = Array(7).fill(0);
        
        // Process orders by day of week
        orders.forEach(order => {
          const dayOfWeek = order.createdAt.getDay(); // 0 = Sunday, 1 = Monday, ...
          const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust so 0 = Monday, 6 = Sunday
          revenue[index] += order.totalAmount;
        });
        break;
        
      case 'month':
        // Monthly view: show data by week of month
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'];
        revenue = Array(5).fill(0);
        
        // Process orders by week of month
        orders.forEach(order => {
          const day = order.createdAt.getDate();
          // Determine which week of the month
          let weekOfMonth;
          if (day <= 7) {
            weekOfMonth = 0; // Week 1
          } else if (day <= 14) {
            weekOfMonth = 1; // Week 2
          } else if (day <= 21) {
            weekOfMonth = 2; // Week 3
          } else if (day <= 28) {
            weekOfMonth = 3; // Week 4
          } else {
            weekOfMonth = 4; // Week 5 (beyond 28)
          }
          revenue[weekOfMonth] += order.totalAmount;
        });
        break;
        
      default:
        // Default to daily view
        return res.status(400).json({
          status: 'Error',
          message: 'Invalid period parameter'
        });
    }
    
    // Calculate total revenue and orders
    totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    totalOrders = orders.length;
    
    console.log('Processed revenue data:', {
      period,
      totalRevenue,
      totalOrders,
      dataPoints: revenue.length
    });
    
    res.json({
      status: 'Ok',
      data: {
        period,
        labels,
        revenue,
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      }
    });
  } catch (error) {
    console.error('Error in getDailyRevenue:', error);
    res.status(500).json({
      status: 'Error',
      message: 'Failed to fetch revenue data'
    });
  }
};

/**
 * Khôi phục tồn kho khi hủy đơn hàng
 * @param {Object} order - Đơn hàng đã bị hủy
 */
const restoreInventoryForOrder = async (order) => {
  try {
    console.log(`===== BẮT ĐẦU KHÔI PHỤC TỒN KHO VÀ SẢN PHẨM CHO ĐƠN HÀNG BỊ HỦY =====`);
    console.log(`Đơn hàng: ${order._id}, Trạng thái: ${order.status}`);
    
    if (!order.products || order.products.length === 0) {
      console.log('Không có sản phẩm nào để khôi phục tồn kho');
      return;
    }
    
    // Log thông tin chi tiết về sản phẩm
    console.log(`Tổng số sản phẩm cần khôi phục: ${order.products.length}`);
    
    // Import các model cần thiết
    const Inventory = mongoose.model('Inventory');
    const Product = mongoose.model('Product');
    
    // Xử lý từng sản phẩm trong đơn hàng
    for (const orderProduct of order.products) {
      console.log(`\n------ Khôi phục sản phẩm: ${orderProduct.name} ------`);
      
      // Lấy thông tin sản phẩm
      let productID = null;
      
      // Trích xuất productID từ nhiều định dạng có thể có
      if (orderProduct.productID) {
        if (typeof orderProduct.productID === 'object' && orderProduct.productID?._id) {
          productID = orderProduct.productID._id.toString();
        } else if (typeof orderProduct.productID === 'string') {
          productID = orderProduct.productID;
        } else if (orderProduct.productID.toString) {
          productID = orderProduct.productID.toString();
        }
        console.log(`ProductID trong đơn hàng: ${productID}`);
      }
      
      const quantity = orderProduct.quantity || 0;
      
      console.log(`ID sản phẩm: ${productID || 'Không có'}`);
      console.log(`Số lượng cần hoàn trả: ${quantity}`);
      
      if (quantity <= 0) {
        console.log('Số lượng không hợp lệ, bỏ qua hoàn trả.');
        continue;
      }
      
      // Lấy variantID từ đơn hàng
      let variantID = null;
      if (orderProduct.variantID) {
        if (typeof orderProduct.variantID === 'object' && orderProduct.variantID?._id) {
          variantID = orderProduct.variantID._id.toString();
        } else if (typeof orderProduct.variantID === 'string') {
          variantID = orderProduct.variantID;
        } else if (orderProduct.variantID.toString) {
          variantID = orderProduct.variantID.toString();
        }
        console.log(`Biến thể ID trong đơn hàng: ${variantID || 'Không có'}`);
      }
      
      // 1. Khôi phục số lượng trong bảng Product
      if (productID && mongoose.Types.ObjectId.isValid(productID)) {
        try {
          console.log(`Tìm kiếm sản phẩm trong database để khôi phục: ${productID}`);
          
          // Tìm sản phẩm trong database
          const product = await Product.findById(productID);
          
          if (product) {
            console.log(`Tìm thấy sản phẩm: ${product.name}`);
            console.log(`Tồn kho hiện tại (sản phẩm): ${product.inventory || 0}`);
            console.log(`Có biến thể: ${product.hasVariants ? 'Có' : 'Không'}`);
            
            // Nếu sản phẩm có biến thể và có variantID
            if (product.hasVariants && variantID && product.detailsVariants && product.detailsVariants.length > 0) {
              console.log(`Tìm biến thể ${variantID} trong sản phẩm`);
              
              // Tìm chi tiết biến thể trong sản phẩm
              let updated = false;
              
              for (let i = 0; i < product.detailsVariants.length; i++) {
                const variant = product.detailsVariants[i];
                
                // Kiểm tra xem đây có phải là biến thể cần cập nhật không
                if (variant._id.toString() === variantID) {
                  console.log(`Tìm thấy biến thể trong sản phẩm: ${variant._id}`);
                  console.log(`Tồn kho biến thể hiện tại: ${variant.inventory}`);
                  
                  // Cập nhật tồn kho biến thể
                  const oldInventory = variant.inventory;
                  product.detailsVariants[i].inventory += quantity;
                  
                  // Cập nhật tổng tồn kho của sản phẩm
                  if (product.inventory !== undefined) {
                    product.inventory += quantity;
                  }
                  
                  await product.save();
                  
                  console.log(`Đã khôi phục tồn kho biến thể trong sản phẩm: ${oldInventory} -> ${product.detailsVariants[i].inventory}`);
                  console.log(`Tổng tồn kho sản phẩm sau khôi phục: ${product.inventory}`);
                  updated = true;
                  break;
                }
              }
              
              if (!updated) {
                console.log(`Không tìm thấy biến thể ${variantID} trong sản phẩm, khôi phục tồn kho tổng`);
                // Nếu không tìm thấy biến thể cụ thể, cập nhật tồn kho tổng
                if (product.inventory !== undefined) {
                  const oldInventory = product.inventory;
                  product.inventory += quantity;
                  await product.save();
                  console.log(`Đã khôi phục tồn kho tổng sản phẩm: ${oldInventory} -> ${product.inventory}`);
                } else {
                  console.log(`Sản phẩm không có trường inventory, không thể khôi phục tồn kho tổng`);
                }
              }
            } 
            // Sản phẩm không có biến thể, cập nhật trực tiếp tồn kho
            else if (!product.hasVariants) {
              if (product.inventory !== undefined) {
                const oldInventory = product.inventory;
                product.inventory += quantity;
                await product.save();
                console.log(`Đã khôi phục tồn kho sản phẩm: ${oldInventory} -> ${product.inventory}`);
              } else {
                console.log(`Sản phẩm không có trường inventory, không thể khôi phục tồn kho`);
              }
            } else {
              console.log(`Sản phẩm có biến thể nhưng không tìm thấy biến thể ID hoặc không có biến thể`);
            }
          } else {
            console.log(`Không tìm thấy sản phẩm với ID: ${productID}`);
          }
        } catch (error) {
          console.error(`Lỗi khi khôi phục sản phẩm trong bảng Product: ${error.message}`);
        }
      }
      
      // 2. Khôi phục số lượng trong bảng Inventory
      // Tạo query để tìm sản phẩm trong kho
      const query = { $or: [] };
      
      // Thêm tìm kiếm theo ID nếu có
      if (productID && mongoose.Types.ObjectId.isValid(productID)) {
        query.$or.push({ _id: productID });
        console.log(`Tìm kiếm theo ID: ${productID}`);
      }
      
      // Thêm tìm kiếm theo mã sản phẩm nếu có
      if (orderProduct.product_code) {
        query.$or.push({ product_code: orderProduct.product_code });
        console.log(`Tìm kiếm theo mã sản phẩm: ${orderProduct.product_code}`);
      }
      
      // Thêm tìm kiếm theo tên sản phẩm
      if (orderProduct.name) {
        query.$or.push({ product_name: orderProduct.name });
        console.log(`Tìm kiếm theo tên: ${orderProduct.name}`);
      }
      
      // Kiểm tra nếu có điều kiện tìm kiếm
      if (query.$or.length === 0) {
        console.log('Không có điều kiện tìm kiếm hợp lệ, bỏ qua hoàn trả.');
        continue;
      }
      
      console.log(`Tìm kiếm sản phẩm trong kho với query:`, JSON.stringify(query));
      
      // Tìm sản phẩm trong kho
      let inventoryItem = null;
      try {
        inventoryItem = await Inventory.findOne(query);
        
        if (!inventoryItem) {
          console.log('Không tìm thấy sản phẩm trong kho để khôi phục.');
          continue;
        }
        
        console.log(`Tìm thấy sản phẩm trong kho: ${inventoryItem.product_name}`);
        console.log(`Tồn kho hiện tại: ${inventoryItem.total_quantity}`);
        
        // Xử lý khôi phục tồn kho cho sản phẩm có biến thể
        if (inventoryItem.hasVariants && inventoryItem.variantDetails && inventoryItem.variantDetails.length > 0 && variantID) {
          console.log(`Sản phẩm có biến thể, tìm biến thể ID: ${variantID}`);
          
          // Tìm biến thể trong sản phẩm
          let variantIndex = -1;
          
          // Tìm kiếm theo nhiều phương pháp để đảm bảo tìm thấy biến thể
          // Phương pháp 1: Tìm theo _id
          variantIndex = inventoryItem.variantDetails.findIndex(v => 
            v._id && v._id.toString() === variantID
          );
          
          // Phương pháp 2: Tìm theo trường _id khác
          if (variantIndex < 0) {
            variantIndex = inventoryItem.variantDetails.findIndex(v => 
              v._id && v._id.toString() === variantID
            );
          }
          
          // Phương pháp 3: Tìm theo trường variantId
          if (variantIndex < 0) {
            variantIndex = inventoryItem.variantDetails.findIndex(v => 
              v.variantId && v.variantId.toString() === variantID
            );
          }
          
          // Phương pháp 4: Tìm theo bất kỳ trường nào có thể là id
          if (variantIndex < 0) {
            for (let i = 0; i < inventoryItem.variantDetails.length; i++) {
              const variant = inventoryItem.variantDetails[i];
              for (const key in variant) {
                if (variant[key] && variant[key].toString && variant[key].toString() === variantID) {
                  variantIndex = i;
                  console.log(`Tìm thấy biến thể qua trường: ${key}`);
                  break;
                }
              }
              if (variantIndex >= 0) break;
            }
          }
          
          if (variantIndex >= 0) {
            console.log(`Tìm thấy biến thể tại vị trí ${variantIndex}`);
            
            // Cập nhật số lượng biến thể
            const variant = inventoryItem.variantDetails[variantIndex];
            const oldQuantity = variant.quantity;
            inventoryItem.variantDetails[variantIndex].quantity += quantity;
            
            // Cập nhật tổng số lượng
            inventoryItem.total_quantity += quantity;
            
            // Cập nhật tổng giá
            inventoryItem.total_price = inventoryItem.variantDetails.reduce(
              (sum, v) => sum + (v.price * v.quantity),
              0
            );
            
            // Lưu thay đổi
            await inventoryItem.save();
            
            console.log(`Đã khôi phục tồn kho biến thể: ${oldQuantity} -> ${inventoryItem.variantDetails[variantIndex].quantity}`);
            console.log(`Tổng tồn kho sau khôi phục: ${inventoryItem.total_quantity}`);
          } else {
            console.log(`Không tìm thấy biến thể với ID ${variantID}, thử tìm theo thuộc tính...`);
            
            // Tìm kiếm theo thuộc tính nếu có
            if (orderProduct.attributes && orderProduct.attributes.length > 0) {
              // Tạo bản đồ thuộc tính từ đơn hàng
              const attributeMap = {};
              orderProduct.attributes.forEach(attr => {
                if (attr.name && attr.value) {
                  let value = attr.value;
                  if (Array.isArray(value)) {
                    value = value[0]; // Lấy giá trị đầu tiên nếu là mảng
                  }
                  attributeMap[attr.name.toLowerCase()] = value.toString().toLowerCase();
                }
              });
              
              console.log(`Thuộc tính từ đơn hàng:`, attributeMap);
              
              // Tìm biến thể phù hợp với thuộc tính
              let bestMatch = null;
              let bestScore = 0;
              
              inventoryItem.variantDetails.forEach((variant, idx) => {
                let score = 0;
                
                // Tạo bản đồ thuộc tính của biến thể
                const variantAttrs = {};
                
                // Xử lý nhiều cách lưu trữ thuộc tính
                if (variant.attributes && typeof variant.attributes === 'object') {
                  // Dạng { Color: "Red", Size: "L" }
                  Object.entries(variant.attributes).forEach(([key, value]) => {
                    variantAttrs[key.toLowerCase()] = value.toString().toLowerCase();
                  });
                }
                
                // So sánh thuộc tính
                for (const [key, value] of Object.entries(attributeMap)) {
                  for (const [vKey, vValue] of Object.entries(variantAttrs)) {
                    // So sánh tên thuộc tính
                    const keyMatch = 
                      key === vKey || 
                      key.includes(vKey) || 
                      vKey.includes(key) ||
                      (key === 'màu sắc' && (vKey === 'color' || vKey === 'màu')) ||
                      (key === 'dung lượng' && (vKey === 'capacity' || vKey === 'size'));
                    
                    // So sánh giá trị
                    const valueMatch = 
                      value === vValue ||
                      value.includes(vValue) ||
                      vValue.includes(value);
                    
                    if (keyMatch && valueMatch) {
                      score += 2;
                    } else if (keyMatch) {
                      score += 1;
                    } else if (valueMatch) {
                      score += 0.5;
                    }
                  }
                }
                
                if (score > bestScore) {
                  bestScore = score;
                  bestMatch = { index: idx, variant };
                }
              });
              
              if (bestMatch && bestScore > 0) {
                console.log(`Tìm thấy biến thể phù hợp: #${bestMatch.index} với điểm ${bestScore}`);
                
                // Cập nhật số lượng
                const oldQuantity = bestMatch.variant.quantity;
                inventoryItem.variantDetails[bestMatch.index].quantity += quantity;
                
                // Cập nhật tổng số lượng
                inventoryItem.total_quantity += quantity;
                
                // Cập nhật tổng giá
                inventoryItem.total_price = inventoryItem.variantDetails.reduce(
                  (sum, v) => sum + (v.price * v.quantity),
                  0
                );
                
                await inventoryItem.save();
                
                console.log(`Đã khôi phục tồn kho biến thể: ${oldQuantity} -> ${inventoryItem.variantDetails[bestMatch.index].quantity}`);
                console.log(`Tổng tồn kho sau khôi phục: ${inventoryItem.total_quantity}`);
              } else {
                // Nếu không tìm thấy, thử khôi phục vào biến thể đầu tiên
                if (inventoryItem.variantDetails.length > 0) {
                  const variant = inventoryItem.variantDetails[0];
                  const oldQuantity = variant.quantity;
                  
                  inventoryItem.variantDetails[0].quantity += quantity;
                  inventoryItem.total_quantity += quantity;
                  inventoryItem.total_price = inventoryItem.variantDetails.reduce(
                    (sum, v) => sum + (v.price * v.quantity),
                    0
                  );
                  
                  await inventoryItem.save();
                  
                  console.log(`Khôi phục vào biến thể đầu tiên: ${oldQuantity} -> ${inventoryItem.variantDetails[0].quantity}`);
                  console.log(`Tổng tồn kho sau khôi phục: ${inventoryItem.total_quantity}`);
                } else {
                  console.log(`Không tìm thấy biến thể phù hợp và không có biến thể đầu tiên để khôi phục`);
                }
              }
            } else {
              // Nếu không có thuộc tính để tìm, khôi phục vào biến thể đầu tiên
              if (inventoryItem.variantDetails.length > 0) {
                const variant = inventoryItem.variantDetails[0];
                const oldQuantity = variant.quantity;
                
                inventoryItem.variantDetails[0].quantity += quantity;
                inventoryItem.total_quantity += quantity;
                inventoryItem.total_price = inventoryItem.variantDetails.reduce(
                  (sum, v) => sum + (v.price * v.quantity),
                  0
                );
                
                await inventoryItem.save();
                
                console.log(`Khôi phục vào biến thể đầu tiên: ${oldQuantity} -> ${inventoryItem.variantDetails[0].quantity}`);
                console.log(`Tổng tồn kho sau khôi phục: ${inventoryItem.total_quantity}`);
              }
            }
          }
        } else if (inventoryItem.hasVariants && inventoryItem.variantDetails && inventoryItem.variantDetails.length > 0) {
          // Có biến thể nhưng không có variantID - thử tìm theo thuộc tính hoặc khôi phục vào biến thể đầu tiên
          if (inventoryItem.variantDetails.length > 0) {
            const variant = inventoryItem.variantDetails[0];
            const oldQuantity = variant.quantity;
            
            inventoryItem.variantDetails[0].quantity += quantity;
            inventoryItem.total_quantity += quantity;
            inventoryItem.total_price = inventoryItem.variantDetails.reduce(
              (sum, v) => sum + (v.price * v.quantity),
              0
            );
            
            await inventoryItem.save();
            
            console.log(`Khôi phục vào biến thể đầu tiên: ${oldQuantity} -> ${inventoryItem.variantDetails[0].quantity}`);
            console.log(`Tổng tồn kho sau khôi phục: ${inventoryItem.total_quantity}`);
          }
        } else {
          // Sản phẩm không có biến thể, khôi phục trực tiếp tổng số lượng
          const oldQuantity = inventoryItem.total_quantity;
          inventoryItem.total_quantity += quantity;
          
          await inventoryItem.save();
          
          console.log(`Đã khôi phục tồn kho: ${oldQuantity} -> ${inventoryItem.total_quantity}`);
        }
      } catch (error) {
        console.error(`Lỗi khi khôi phục tồn kho trong Inventory: ${error.message}`);
      }
    }
    
    console.log(`===== KẾT THÚC KHÔI PHỤC TỒN KHO VÀ SẢN PHẨM CHO ĐƠN HÀNG BỊ HỦY =====`);
  } catch (error) {
    console.error(`Lỗi khi khôi phục tồn kho: ${error.message}`);
    console.error(error.stack);
  }
};

// Lấy chi tiết đơn hàng dạng JSON cho modal
const getOrderDetailJson = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'Error',
        message: "Không tìm thấy đơn hàng!"
      });
    }
    
    return res.status(200).json({
      status: 'Ok',
      data: order
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    return res.status(500).json({
      status: 'Error',
      message: "Có lỗi xảy ra khi lấy thông tin đơn hàng"
    });
  }
};

// Get orders for dashboard with pagination and filtering
const getOrdersForDashboard = async (req, res) => {
  try {
    console.log('Fetching orders for dashboard:', req.query);
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    // Get date range from query parameters
    let startDate, endDate;
    
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
      console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } else {
      // Default to current day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today;
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      endDate = tomorrow;
      
      console.log(`Using default date range (today): ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }
    
    // Build the query
    const query = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Count total matching documents for pagination
    const totalOrders = await Order.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);
    
    // Fetch orders with pagination
    const orders = await Order.find(query)
      .populate('customerID', 'fullName phoneNumber email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Found ${orders.length} orders (page ${page}/${totalPages}, total: ${totalOrders})`);
    
    res.json({
      status: 'Ok',
      data: {
        orders,
        totalOrders,
        totalPages,
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error in getOrdersForDashboard:', error);
    res.status(500).json({
      status: 'Error',
      message: error.message
    });
  }
};

// Update the updateOrderStatus controller function
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    
    console.log(`Nhận yêu cầu thay đổi trạng thái đơn hàng ${id} thành ${status}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    // Kiểm tra nếu đơn hàng tồn tại
    const existingOrder = await Order.findById(id);
    
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Xử lý logic thay đổi trạng thái
    try {
      const updatedOrder = await processOrderStatusChange(id, status, cancelReason);
      
      // Trả về kết quả
      return res.status(200).json({
        success: true,
        message: 'Đã cập nhật trạng thái đơn hàng',
        order: {
          _id: updatedOrder._id,
          orderID: updatedOrder.orderID,
          status: updatedOrder.status,
          cancelReason: updatedOrder.cancelReason,
          totalAmount: updatedOrder.totalAmount,
          paymentStatus: updatedOrder.paymentStatus
        }
      });
    } catch (processingError) {
      console.error('Lỗi khi xử lý thay đổi trạng thái:', processingError);
      return res.status(500).json({
        success: false,
        message: `Lỗi xử lý: ${processingError.message}`
      });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi: ${error.message}`
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
  getOrdersJson,
  getMobileOrdersList,
  getOrderDetail,
  getOrderDetailJson,
  updateOrderPayment,
  getPaymentStats,
  getOrderDistribution,
  getEmployeePerformance,
  getDailyRevenue,
  getOrdersForDashboard
};