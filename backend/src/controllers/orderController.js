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
    
    // Debugging: Log all products in the order
    console.log(`Tổng số sản phẩm trong đơn hàng: ${order.products.length}`);
    console.log('Chi tiết sản phẩm trong đơn hàng:');
    order.products.forEach((product, index) => {
      console.log(`--- Sản phẩm #${index + 1} ---`);
      console.log(`Tên: ${product.name}`);
      console.log(`ID: ${product.productID}`);
      console.log(`Loại ID: ${typeof product.productID}`);
      if (typeof product.productID === 'object') {
        console.log(`Object ID: ${product.productID._id}`);
      }
      console.log(`VariantID: ${product.variantID || 'Không có'}`);
      console.log(`Loại VariantID: ${product.variantID ? typeof product.variantID : 'N/A'}`);
      if (product.variantID && typeof product.variantID === 'object') {
        console.log(`Object VariantID: ${product.variantID._id}`);
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
      let productID;
      if (typeof orderProduct.productID === 'object' && orderProduct.productID._id) {
        productID = orderProduct.productID._id.toString();
      } else if (orderProduct.productID) {
        productID = orderProduct.productID.toString();
      } else {
        console.error(`Sản phẩm không có ID hợp lệ: ${orderProduct.name}`);
        continue;
      }
      
      // Ensure we don't have a combined ID format (product-variant)
      if (productID.includes('-')) {
        const parts = productID.split('-');
        productID = parts[0];
        // If variantID isn't set but we have it in the combined format, use it
        if (!orderProduct.variantID && parts[1]) {
          orderProduct.variantID = parts[1];
        }
      }
      
      const quantity = orderProduct.quantity || 1;
      
      console.log(`ID Sản phẩm: ${productID}`);
      console.log(`Số lượng: ${quantity}`);
      
      // Sửa phần xác định ID biến thể
      let variantID = null;
      if (orderProduct.variantID) {
        if (typeof orderProduct.variantID === 'object') {
          variantID = orderProduct.variantID._id ? orderProduct.variantID._id.toString() : null;
        } else {
          variantID = orderProduct.variantID.toString();
        }
      }
      
      // Validate variant ID is a valid MongoDB ObjectID
      if (variantID && !mongoose.Types.ObjectId.isValid(variantID)) {
        console.error(`Biến thể ID không hợp lệ: ${variantID}, bỏ qua biến thể`);
        variantID = null;
      }
      
      console.log(`Biến thể ID (đã xử lý): ${variantID || 'Không có'}`);
      
      try {
        // Tìm kiếm trong Inventory thay vì DetailsVariant
        // Tạo query để tìm sản phẩm trong kho bằng nhiều cách khác nhau
        const query = { $or: [
          { _id: productID } // First try by exact ID
        ]};
        
        // Add product code to query if available
        if (orderProduct.product_code) {
          query.$or.push({ product_code: orderProduct.product_code });
          console.log(`Thêm tìm kiếm theo mã sản phẩm: ${orderProduct.product_code}`);
        }
        
        // Thêm điều kiện tìm kiếm theo tên nếu có
        if (orderProduct.name) {
          query.$or.push({ product_name: orderProduct.name });
        }
        
        console.log('Tìm kiếm sản phẩm trong kho với query:', JSON.stringify(query));
        
        let inventoryItem = await Inventory.findOne(query);
        
        if (!inventoryItem) {
          console.log(`Không tìm thấy sản phẩm trong kho với ID: ${productID}`);
          // Thử tìm kiếm lại sản phẩm theo ID nhưng dưới dạng string
          const inventoryByStringId = await Inventory.findOne({ _id: productID.toString() });
          if (inventoryByStringId) {
            console.log(`Tìm thấy sản phẩm trong kho với ID string: ${productID.toString()}`);
            // Cập nhật inventoryItem để tiếp tục xử lý
            inventoryItem = inventoryByStringId;
          } else {
            // Nếu vẫn không tìm thấy, thử tìm tất cả các sản phẩm và log ra để debug
            console.log(`Thử liệt kê 5 sản phẩm đầu tiên trong kho để debug:`);
            const sampleInventories = await Inventory.find().limit(5);
            sampleInventories.forEach((item, index) => {
              console.log(`Sản phẩm #${index + 1}: ${item._id}, ${item.product_name}, ${item.product_code}`);
            });
            continue;
          }
        }
        
        console.log(`Tìm thấy sản phẩm trong kho: ${inventoryItem.product_name}`);
        console.log(`Tồn kho hiện tại: ${inventoryItem.total_quantity}`);
        
        if (variantID) {
          console.log(`Tìm biến thể trong sản phẩm kho...`);
          
          // Biến thể trong Inventory được lưu dưới dạng variantDetails array
          if (inventoryItem.hasVariants && inventoryItem.variantDetails && inventoryItem.variantDetails.length > 0) {
            // Tìm biến thể dựa vào ID
            const variantIndex = inventoryItem.variantDetails.findIndex(v => 
              v._id && v._id.toString() === variantID
            );
            
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
              // Thử tìm biến thể bằng cách so sánh thuộc tính
              console.log(`Không tìm thấy biến thể theo ID, thử tìm theo thuộc tính...`);
              
              if (orderProduct.attributes && orderProduct.attributes.length > 0) {
                // Lọc các thuộc tính có giá trị
                const productAttributes = orderProduct.attributes.filter(attr => 
                  attr.value && (Array.isArray(attr.value) ? attr.value.length > 0 : true)
                );
                
                if (productAttributes.length > 0) {
                  console.log(`Thuộc tính cần tìm:`, JSON.stringify(productAttributes));
                  
                  // Tìm biến thể phù hợp với thuộc tính
                  let matchedVariantIndex = -1;
                  
                  for (let i = 0; i < inventoryItem.variantDetails.length; i++) {
                    const variantDetail = inventoryItem.variantDetails[i];
                    const attributes = variantDetail.attributes;
                    
                    // Kiểm tra xem tất cả thuộc tính có khớp không
                    let attributesMatch = true;
                    
                    for (const attr of productAttributes) {
                      const attrName = attr.name.toLowerCase();
                      const attrValues = Array.isArray(attr.value) 
                        ? attr.value.map(v => v.toString().toLowerCase()) 
                        : [attr.value.toString().toLowerCase()];
                      
                      // Tìm thuộc tính tương ứng trong biến thể
                      let foundMatch = false;
                      
                      // Kiểm tra attributes là Map hay Object
                      if (attributes instanceof Map) {
                        // Duyệt qua các entries trong Map
                        for (const [key, value] of attributes.entries()) {
                          // Kiểm tra nếu key chứa tên thuộc tính
                          if (key.toLowerCase().includes(attrName) || attrName.includes(key.toLowerCase())) {
                            const variantValue = value.toString().toLowerCase();
                            if (attrValues.includes(variantValue)) {
                              foundMatch = true;
                              break;
                            }
                          }
                        }
                      } else if (typeof attributes === 'object') {
                        // Duyệt qua các thuộc tính trong object
                        for (const [key, value] of Object.entries(attributes)) {
                          if (key.toLowerCase().includes(attrName) || attrName.includes(key.toLowerCase())) {
                            const variantValue = value.toString().toLowerCase();
                            if (attrValues.includes(variantValue)) {
                              foundMatch = true;
                              break;
                            }
                          }
                        }
                      }
                      
                      if (!foundMatch) {
                        attributesMatch = false;
                        break;
                      }
                    }
                    
                    if (attributesMatch) {
                      matchedVariantIndex = i;
                      break;
                    }
                  }
                  
                  if (matchedVariantIndex >= 0) {
                    const variant = inventoryItem.variantDetails[matchedVariantIndex];
                    console.log(`Tìm thấy biến thể khớp theo thuộc tính: ${matchedVariantIndex}`);
                    console.log(`Tồn kho biến thể hiện tại: ${variant.quantity}`);
                    
                    // Kiểm tra tồn kho
                    if (variant.quantity < quantity) {
                      console.log(`Cảnh báo: Không đủ tồn kho (cần ${quantity}, hiện có ${variant.quantity})`);
                      continue;
                    }
                    
                    // Cập nhật tồn kho biến thể
                    const oldQuantity = variant.quantity;
                    inventoryItem.variantDetails[matchedVariantIndex].quantity -= quantity;
                    
                    // Cập nhật tổng số lượng của sản phẩm
                    inventoryItem.total_quantity -= quantity;
                    
                    // Cập nhật tổng giá (recalculate tổng giá để đảm bảo đúng với các biến thể)
                    inventoryItem.total_price = inventoryItem.variantDetails.reduce(
                      (sum, v) => sum + (v.price * v.quantity),
                      0
                    );
                    
                    // Lưu thay đổi
                    await inventoryItem.save();
                    
                    console.log(`Đã cập nhật tồn kho biến thể: ${oldQuantity} -> ${inventoryItem.variantDetails[matchedVariantIndex].quantity}`);
                    console.log(`Tổng tồn kho sau cập nhật: ${inventoryItem.total_quantity}`);
                  } else {
                    console.log(`Không tìm thấy biến thể khớp với thuộc tính`);
                  }
                }
              }
            }
          } else {
            console.log(`Sản phẩm không có danh sách biến thể`);
          }
        } else {
          // Nếu không có biến thể, cập nhật trực tiếp vào tổng tồn kho
          console.log(`Cập nhật tổng tồn kho sản phẩm`);
          
          if (inventoryItem.total_quantity < quantity) {
            console.log(`Cảnh báo: Không đủ tồn kho (cần ${quantity}, hiện có ${inventoryItem.total_quantity})`);
            continue;
          }
          
          // Lưu giá trị hiện tại trước khi cập nhật
          const oldQuantity = inventoryItem.total_quantity;
          
          // Cập nhật tổng tồn kho
          inventoryItem.total_quantity -= quantity;
          
          // Nếu không có biến thể, cập nhật giá dựa trên giá đơn vị (nếu có)
          if (!inventoryItem.hasVariants) {
            const unitPrice = inventoryItem.total_price / oldQuantity;
            console.log(`Tính lại giá cho sản phẩm không có biến thể: oldQuantity=${oldQuantity}, unitPrice=${unitPrice}`);
            inventoryItem.total_price = unitPrice * inventoryItem.total_quantity;
            console.log(`Giá mới sau cập nhật: ${inventoryItem.total_price}`);
          } else {
            // Nếu có biến thể nhưng đang cập nhật tổng, vẫn tính lại tổng giá từ biến thể
            inventoryItem.total_price = inventoryItem.variantDetails.reduce(
              (sum, v) => sum + (v.price * v.quantity),
              0
            );
          }
          
          // Lưu thay đổi
          await inventoryItem.save();
          
          console.log(`Đã cập nhật tổng tồn kho: ${oldQuantity} -> ${inventoryItem.total_quantity}`);
        }
      } catch (error) {
        console.error(`Lỗi khi cập nhật tồn kho: ${error.message}`);
        console.error(error.stack);
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

// Hàm độc lập để xử lý việc cập nhật tồn kho
const processOrderStatusChange = async (orderId, newStatus, cancelReason) => {
  try {
    console.log(`===== XỬ LÝ THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG =====`);
    console.log(`Đơn hàng: ${orderId}, Trạng thái mới: ${newStatus}`);
    
    // Tìm đơn hàng theo ID với thông tin chi tiết hơn
    const order = await Order.findById(orderId)
      .populate('customerID', 'fullName phoneNumber email address')
      .populate('employeeID', 'fullName position')
      .populate({
        path: 'products.productID',
        model: 'Product',
        populate: [
          { path: 'detailsVariants' },
          { path: 'category' },
          { path: 'providerId' }
        ],
        select: 'name thumbnail price inventory hasVariants product_code detailsVariants category providerId'
      })
      .populate({
        path: 'products.variantID',
        model: 'DetailsVariant',
        select: '_id productId variantDetails price inventory'
      });
    
    if (!order) {
      console.log(`Không tìm thấy đơn hàng với ID: ${orderId}`);
      throw new Error('Không tìm thấy đơn hàng');
    }
    
    // Truy vấn thêm để lấy thông tin đơn hàng hoàn chỉnh
    const Product = mongoose.model('Product');
    
    // Thêm thông tin chi tiết cho sản phẩm đặc biệt là các thuộc tính biến thể
    for (const product of order.products) {
      // Xử lý thuộc tính đặc biệt nếu có
      if (product.attributes && product.attributes.length > 0) {
        console.log(`Sản phẩm ${product.name} có ${product.attributes.length} thuộc tính`);
        
        // Tìm thông tin đầy đủ về biến thể dựa trên thuộc tính
        if (product.productID && !product.variantID) {
          const productObj = await Product.findById(
            typeof product.productID === 'object' ? product.productID._id : product.productID
          )
          .populate('detailsVariants')
          .lean();
          
          if (productObj && productObj.detailsVariants && productObj.detailsVariants.length > 0) {
            console.log(`Sản phẩm có ${productObj.detailsVariants.length} biến thể chi tiết`);
            
            // Tạo một bản đồ thuộc tính từ đơn hàng để tìm biến thể phù hợp
            const orderVariantMap = {};
            for (const attr of product.attributes) {
              if (attr.name && attr.value) {
                orderVariantMap[attr.name.toLowerCase()] = Array.isArray(attr.value) 
                  ? attr.value.map(v => v.toString().toLowerCase())
                  : [attr.value.toString().toLowerCase()];
              }
            }
            
            console.log(`Bản đồ thuộc tính từ đơn hàng:`, orderVariantMap);
            
            // Tìm biến thể phù hợp nhất
            let bestMatch = null;
            let bestMatchScore = 0;
            
            for (const detailVariant of productObj.detailsVariants) {
              let matchScore = 0;
              
              // Chỉ xử lý nếu có thông tin biến thể
              if (detailVariant.variantDetails && detailVariant.variantDetails.length > 0) {
                for (const varDetail of detailVariant.variantDetails) {
                  if (varDetail.variantId && varDetail.value) {
                    // Tìm tên biến thể từ database
                    try {
                      const Variant = mongoose.model('Variant');
                      const variantData = await Variant.findById(varDetail.variantId).lean();
                      
                      if (variantData) {
                        const variantName = variantData.name.toLowerCase();
                        const variantValue = varDetail.value.toLowerCase();
                        
                        // Kiểm tra nếu thuộc tính này có trong đơn hàng
                        for (const [orderAttrName, orderAttrValues] of Object.entries(orderVariantMap)) {
                          if (orderAttrName === variantName || 
                              orderAttrName.includes(variantName) || 
                              variantName.includes(orderAttrName)) {
                            // Kiểm tra giá trị
                            if (orderAttrValues.includes(variantValue)) {
                              matchScore++;
                              console.log(`Khớp thuộc tính: ${variantName}=${variantValue}`);
                            }
                          }
                        }
                      }
                    } catch (err) {
                      console.log(`Lỗi khi tìm thông tin biến thể ${varDetail.variantId}: ${err.message}`);
                    }
                  }
                }
              }
              
              // Cập nhật biến thể khớp nhất
              if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                bestMatch = detailVariant;
              }
            }
            
            // Nếu tìm thấy biến thể phù hợp, gán lại vào product
            if (bestMatch) {
              console.log(`Tìm thấy biến thể phù hợp ID: ${bestMatch._id}, khớp ${bestMatchScore} thuộc tính`);
              product.variantID = bestMatch._id;
            } else {
              console.log(`Không tìm thấy biến thể phù hợp cho sản phẩm ${product.name}`);
            }
          }
        }
      }
    }
    
    // Nếu đơn hàng đã ở trạng thái này, không cần xử lý
    if (order.status === newStatus) {
      console.log(`Đơn hàng đã ở trạng thái ${newStatus}, không cần thay đổi`);
      return order;
    }
    
    // Nếu đơn hàng bị hủy, cập nhật lý do hủy và đặt tổng tiền về 0
    if (newStatus === 'canceled') {
      if (cancelReason) {
        order.cancelReason = cancelReason;
      }
      
      // Lưu tổng tiền ban đầu vào originalAmount nếu chưa có
      if (!order.originalAmount) {
        order.originalAmount = order.totalAmount;
      }
      
      order.totalAmount = 0;
      console.log(`Đơn hàng ${orderId} bị hủy, đặt tổng tiền về 0`);
    }
    
    // Cập nhật trạng thái mới
    order.status = newStatus;
    await order.save();
    
    // Xử lý cập nhật tồn kho nếu cần
    if (newStatus === 'processing' && 
        (order.paymentStatus === 'paid' || order.paymentStatus === 'partpaid')) {
      // Nếu đơn hàng được xử lý và đã thanh toán ít nhất một phần, cập nhật tồn kho
      console.log(`Đơn hàng ${orderId} chuyển sang trạng thái processing và đã thanh toán, sẽ cập nhật tồn kho`);
      await updateInventoryForOrder(order);
    } else if (newStatus === 'canceled') {
      // Nếu đơn hàng bị hủy, hoàn trả tồn kho
      console.log(`Đơn hàng ${orderId} chuyển sang trạng thái canceled, sẽ hoàn trả tồn kho`);
      
      // Kiểm tra xem đơn hàng có sản phẩm không
      if (order.products && order.products.length > 0) {
        console.log(`Đơn hàng có ${order.products.length} sản phẩm cần hoàn trả tồn kho`);
        
        // Log chi tiết sản phẩm
        order.products.forEach((product, index) => {
          console.log(`Sản phẩm #${index + 1}: ${product.name}, SL cần hoàn trả: ${product.quantity}`);
          if (product.attributes && product.attributes.length > 0) {
            console.log(`- Thuộc tính: ${JSON.stringify(product.attributes)}`);
          }
          if (product.variantID) {
            console.log(`- Biến thể ID: ${typeof product.variantID === 'object' ? product.variantID._id : product.variantID}`);
          }
        });
        
        // Hoàn trả tồn kho cho các sản phẩm
        await restoreInventoryForOrder(order);
      } else {
        console.log(`Đơn hàng không có sản phẩm, không cần hoàn trả tồn kho`);
      }
    }
    
    console.log(`===== KẾT THÚC XỬ LÝ THAY ĐỔI TRẠNG THÁI =====`);
    return order;
  } catch (error) {
    console.error(`Lỗi khi xử lý thay đổi trạng thái đơn hàng:`, error);
    throw error;
  }
};

const updateOrderPayment = async (req, res) => {
  const orderId = req.params.id;
  const { paymentMethod, paymentStatus, amount } = req.body;

  console.log(`===== REQUEST: Cập nhật thanh toán đơn hàng ${orderId} =====`);
  console.log(`Dữ liệu nhận được:`, req.body);

  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error(`OrderID không hợp lệ: ${orderId}`);
      return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ!' });
    }

    // Tìm đơn hàng cần cập nhật
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
    }
    
    console.log(`Số tiền đã thanh toán sau khi cập nhật: ${currentPaidAmount}/${order.totalAmount}`);
    
    // Xác định trạng thái thanh toán sau khi cập nhật
    let updatedPaymentStatus = paymentStatus;
    let updatedOrderStatus = order.status;
    
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
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentMethod,
        paymentStatus: updatedPaymentStatus,
        paidAmount: currentPaidAmount,
        paymentDetails: paymentDetails,
        status: updatedOrderStatus
      },
      { new: true }
    );

    console.log('Đơn hàng đã được cập nhật thành công:', {
      id: updatedOrder._id,
      orderID: updatedOrder.orderID,
      paymentStatus: updatedOrder.paymentStatus,
      status: updatedOrder.status,
      paidAmount: updatedOrder.paidAmount,
      paymentDetails: updatedOrder.paymentDetails
    });

    // Thêm đoạn code này: Nếu đơn hàng vừa được chuyển sang trạng thái processing và đã thanh toán đủ, cập nhật tồn kho
    if (updatedOrderStatus === 'processing' && updatedPaymentStatus === 'paid' && order.status !== 'processing') {
      console.log('Đơn hàng vừa chuyển sang trạng thái processing và đã thanh toán đủ, đang cập nhật tồn kho...');
      await updateInventoryForOrder(updatedOrder);
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
 * Hoàn trả tồn kho khi hủy đơn hàng
 * @param {Object} order - Đơn hàng đã được hủy
 */
const restoreInventoryForOrder = async (order) => {
  try {
    console.log(`===== BẮT ĐẦU HOÀN TRẢ TỒN KHO CHO ĐƠN HÀNG ${order._id} =====`);
    console.log(`Trạng thái đơn hàng: ${order.status}`);
    console.log(`Số lượng sản phẩm: ${order.products ? order.products.length : 0}`);
    
    // Nếu không có sản phẩm, thoát
    if (!order.products || order.products.length === 0) {
      console.log('Không có sản phẩm nào để hoàn trả tồn kho.');
      return;
    }
    
    // Đảm bảo model Inventory đã được import
    const Inventory = mongoose.model('Inventory');
    const Variant = mongoose.model('Variant');
    
    if (!Inventory) {
      console.error('Không thể tìm thấy model Inventory');
      return;
    }
    
    // Cache các biến thể để tra cứu nhanh
    const variantCache = {};
    try {
      const variants = await Variant.find({}).lean();
      for (const variant of variants) {
        variantCache[variant._id.toString()] = {
          name: variant.name,
          values: variant.values || []
        };
      }
      console.log(`Đã cache ${Object.keys(variantCache).length} biến thể từ database`);
    } catch (err) {
      console.log(`Không thể cache thông tin biến thể từ database: ${err.message}`);
    }
    
    // Xử lý từng sản phẩm trong đơn hàng
    for (const orderProduct of order.products) {
      try {
        console.log(`\n------ Xử lý hoàn trả sản phẩm: ${orderProduct.name || 'Không có tên'} ------`);
        
        // Lấy productID - trong trường hợp này là ID của inventory
        let inventoryId = null;
        
        // Log raw productID để debug
        console.log('ProductID raw:', JSON.stringify(orderProduct.productID));
        
        if (orderProduct.productID) {
          if (typeof orderProduct.productID === 'object') {
            // Nếu là object với _id
            if (orderProduct.productID._id) {
              inventoryId = orderProduct.productID._id.toString();
              console.log('Extracted from object._id:', inventoryId);
            } else if (orderProduct.productID.toString) {
              // Nếu là ObjectId (có method toString)
              inventoryId = orderProduct.productID.toString();
              console.log('Extracted from ObjectId.toString():', inventoryId);
            }
          } else if (typeof orderProduct.productID === 'string') {
            // Nếu là string
            inventoryId = orderProduct.productID;
            console.log('Using string directly:', inventoryId);
          }
        }
        
        // Thêm kiểm tra phụ trợ: nếu productID giống như trong ảnh đính kèm
        if (!inventoryId && orderProduct.productID && typeof orderProduct.productID === 'string' && 
            orderProduct.productID.includes('ObjectId')) {
          // Trích xuất ID từ chuỗi như "ObjectId('680661060cd57076d5b91995')"
          const match = orderProduct.productID.match(/ObjectId\(['"]([^'"]+)['"]\)/);
          if (match && match[1]) {
            inventoryId = match[1];
            console.log('Extracted from ObjectId string:', inventoryId);
          }
        }
        
        const quantity = orderProduct.quantity || 0;
        
        console.log(`ID Inventory (productID): ${inventoryId || 'Không có'}`);
        console.log(`Số lượng cần hoàn trả: ${quantity}`);
        
        if (!inventoryId || quantity <= 0) {
          console.log('Không có ID inventory hoặc số lượng không hợp lệ, bỏ qua hoàn trả.');
          continue;
        }
        
        // Đảm bảo inventoryId là ID hợp lệ để tránh lỗi MongoDB
        if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
          console.log(`ID Inventory không hợp lệ: ${inventoryId}`);
          continue;
        }
        
        // Lấy variantID từ đơn hàng
        let variantId = null;
        if (orderProduct.variantID) {
          if (typeof orderProduct.variantID === 'object' && orderProduct.variantID._id) {
            variantId = orderProduct.variantID._id.toString();
          } else if (typeof orderProduct.variantID === 'string') {
            variantId = orderProduct.variantID;
          } else if (orderProduct.variantID.toString) {
            variantId = orderProduct.variantID.toString();
          }
          console.log(`Biến thể ID trong đơn hàng: ${variantId}`);
        }
        
        // Tìm inventory trực tiếp bằng ID
        let inventoryItem = null;
        try {
          // Thử nhiều cách để tìm inventory
          inventoryItem = await Inventory.findById(inventoryId);
          
          if (!inventoryItem) {
            console.log(`Không tìm thấy inventory bằng findById, thử phương pháp khác...`);
            
            // Thử tìm bằng cách tạo ObjectId mới
            try {
              const objId = new mongoose.Types.ObjectId(inventoryId);
              inventoryItem = await Inventory.findOne({ _id: objId });
              
              if (inventoryItem) {
                console.log(`Tìm thấy inventory sử dụng ObjectId mới: ${inventoryItem._id}`);
              }
            } catch (objIdError) {
              console.log(`Lỗi khi tạo ObjectId mới: ${objIdError.message}`);
            }
            
            // Nếu vẫn không tìm thấy, thử tìm bằng regex
            if (!inventoryItem) {
              const regex = new RegExp(inventoryId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
              inventoryItem = await Inventory.findOne({ 
                $or: [
                  { product_code: regex },
                  { product_name: orderProduct.name }
                ] 
              });
              
              if (inventoryItem) {
                console.log(`Tìm thấy inventory sử dụng regex/name: ${inventoryItem._id}`);
              }
            }
            
            if (!inventoryItem) {
              console.log(`Không tìm được inventory cho sản phẩm này, bỏ qua.`);
              continue;
            }
          }
          
          console.log(`Đã tìm thấy inventory: ${inventoryItem.product_name} (ID: ${inventoryItem._id})`);
          console.log(`Tổng tồn kho hiện tại: ${inventoryItem.total_quantity}`);
          console.log(`Có biến thể: ${inventoryItem.hasVariants ? 'Có' : 'Không'}`);
          
          // Nếu inventory có biến thể, cần tìm biến thể phù hợp để cập nhật
          if (inventoryItem.hasVariants && inventoryItem.variantDetails && inventoryItem.variantDetails.length > 0) {
            console.log(`Inventory có ${inventoryItem.variantDetails.length} biến thể`);
            
            // 1. Nếu có variantId, tìm chính xác theo ID trong variantDetails
            if (variantId) {
              console.log(`Tìm biến thể theo ID: ${variantId}`);
              
              // Tìm biến thể có ID khớp với variantId
              const exactVariantIndex = inventoryItem.variantDetails.findIndex(v => 
                v._id && v._id.toString() === variantId
              );
              
              if (exactVariantIndex !== -1) {
                console.log(`Tìm thấy biến thể chính xác theo ID ở vị trí ${exactVariantIndex}`);
                const matchedVariant = inventoryItem.variantDetails[exactVariantIndex];
                
                try {
                  // Cập nhật trực tiếp vào MongoDB
                  const updateResult = await Inventory.updateOne(
                    { 
                      _id: inventoryItem._id,
                      'variantDetails._id': matchedVariant._id 
                    },
                    { 
                      $inc: { 
                        'variantDetails.$.quantity': quantity,
                        'total_quantity': quantity 
                      } 
                    }
                  );
                  
                  console.log(`Đã hoàn trả ${quantity} vào biến thể ID ${variantId}`);
                  console.log(`Kết quả cập nhật: ${JSON.stringify(updateResult)}`);
                  continue; // Xử lý xong sản phẩm này
                } catch (error) {
                  console.error(`Lỗi khi cập nhật biến thể theo ID: ${error.message}`);
                }
              } else {
                console.log(`Không tìm thấy biến thể có ID: ${variantId}`);
              }
            }
            
            // 2. Nếu không tìm thấy theo ID, thử tìm theo thuộc tính
            if (orderProduct.attributes && orderProduct.attributes.length > 0) {
              console.log(`Tìm biến thể theo thuộc tính`);
              
              // Chuyển đổi thuộc tính từ đơn hàng thành map để dễ so sánh
              const orderAttributes = {};
              for (const attr of orderProduct.attributes) {
                if (attr && attr.name && attr.value !== undefined) {
                  const attrName = attr.name.toLowerCase();
                  const attrValue = Array.isArray(attr.value) 
                    ? attr.value.map(v => v.toString().toLowerCase()) 
                    : [attr.value.toString().toLowerCase()];
                  orderAttributes[attrName] = attrValue;
                }
              }
              
              console.log(`Thuộc tính từ đơn hàng:`, orderAttributes);
              
              // Tìm biến thể khớp nhất
              let bestMatchIndex = -1;
              let bestMatchScore = 0;
              
              // Kiểm tra từng biến thể
              for (let i = 0; i < inventoryItem.variantDetails.length; i++) {
                const variant = inventoryItem.variantDetails[i];
                if (!variant.attributes) continue;
                
                let matchScore = 0;
                let matchDetails = [];
                
                // Xem thuộc tính trong biến thể của inventory
                console.log(`Kiểm tra biến thể #${i+1}:`, JSON.stringify(variant.attributes));
                
                // Inventory lưu attributes dưới dạng { [variantId]: value }
                // Cần chuyển đổi variantId thành tên thuộc tính
                for (const [attrId, attrValue] of Object.entries(variant.attributes)) {
                  // Lấy thông tin biến thể từ cache
                  const variantInfo = variantCache[attrId];
                  
                  if (variantInfo) {
                    const variantName = variantInfo.name.toLowerCase();
                    const variantValue = attrValue.toString().toLowerCase();
                    
                    // Tìm trong thuộc tính đơn hàng
                    for (const [orderAttrName, orderAttrValues] of Object.entries(orderAttributes)) {
                      if (orderAttrName === variantName || 
                          orderAttrName.includes(variantName) || 
                          variantName.includes(orderAttrName)) {
                        
                        if (orderAttrValues.includes(variantValue)) {
                          matchScore++;
                          matchDetails.push(`${variantName}=${variantValue}`);
                          break;
                        }
                      }
                    }
                  } else {
                    console.log(`Không tìm thấy thông tin biến thể trong cache: ${attrId}`);
                  }
                }
                
                console.log(`Biến thể #${i+1} có điểm số: ${matchScore}, khớp: ${matchDetails.join(', ')}`);
                
                // Cập nhật biến thể tốt nhất
                if (matchScore > bestMatchScore) {
                  bestMatchScore = matchScore;
                  bestMatchIndex = i;
                }
              }
              
              // Nếu tìm thấy ít nhất một thuộc tính khớp
              if (bestMatchIndex !== -1 && bestMatchScore > 0) {
                console.log(`Tìm thấy biến thể khớp nhất ở vị trí ${bestMatchIndex} với ${bestMatchScore} thuộc tính khớp`);
                const matchedVariant = inventoryItem.variantDetails[bestMatchIndex];
                
                try {
                  // Cập nhật trực tiếp vào MongoDB
                  const updateResult = await Inventory.updateOne(
                    { 
                      _id: inventoryItem._id,
                      'variantDetails._id': matchedVariant._id 
                    },
                    { 
                      $inc: { 
                        'variantDetails.$.quantity': quantity,
                        'total_quantity': quantity 
                      } 
                    }
                  );
                  
                  console.log(`Đã hoàn trả ${quantity} vào biến thể có thuộc tính khớp`);
                  console.log(`Kết quả cập nhật: ${JSON.stringify(updateResult)}`);
                  continue; // Xử lý xong sản phẩm này
                } catch (error) {
                  console.error(`Lỗi khi cập nhật biến thể theo thuộc tính: ${error.message}`);
                }
              } else {
                console.log(`Không tìm thấy biến thể nào khớp với thuộc tính`);
              }
            }
            
            // 3. Nếu vẫn không tìm được biến thể phù hợp, cập nhật vào biến thể đầu tiên
            if (inventoryItem.variantDetails.length > 0) {
              console.log(`Cập nhật vào biến thể đầu tiên`);
              const firstVariant = inventoryItem.variantDetails[0];
              
              try {
                // Cập nhật trực tiếp vào MongoDB
                const updateResult = await Inventory.updateOne(
                  { 
                    _id: inventoryItem._id,
                    'variantDetails._id': firstVariant._id 
                  },
                  { 
                    $inc: { 
                      'variantDetails.$.quantity': quantity,
                      'total_quantity': quantity 
                    } 
                  }
                );
                
                console.log(`Đã hoàn trả ${quantity} vào biến thể đầu tiên`);
                console.log(`Kết quả cập nhật: ${JSON.stringify(updateResult)}`);
              } catch (error) {
                console.error(`Lỗi khi cập nhật biến thể đầu tiên: ${error.message}`);
              }
            }
          } else {
            // Nếu inventory không có biến thể, cập nhật tổng tồn kho
            console.log(`Inventory không có biến thể, cập nhật tổng tồn kho`);
            
            try {
              const unitPrice = inventoryItem.total_quantity > 0 
                ? inventoryItem.total_price / inventoryItem.total_quantity
                : 0;
                
              const updateQuery = { 
                $inc: { total_quantity: quantity }
              };
              
              if (unitPrice > 0) {
                updateQuery.$inc.total_price = unitPrice * quantity;
              }
              
              // Cập nhật trực tiếp vào MongoDB
              const updateResult = await Inventory.updateOne(
                { _id: inventoryItem._id },
                updateQuery
              );
              
              console.log(`Đã hoàn trả ${quantity} vào tổng tồn kho`);
              console.log(`Kết quả cập nhật: ${JSON.stringify(updateResult)}`);
            } catch (error) {
              console.error(`Lỗi khi cập nhật tổng tồn kho: ${error.message}`);
            }
          }
        } catch (error) {
          console.error(`Lỗi khi xử lý hàng tồn kho: ${error.message}`);
          console.error(error.stack);
        }
      } catch (error) {
        console.error(`Lỗi khi xử lý sản phẩm: ${error.message}`);
        console.error(error.stack);
      }
    }
    
    console.log(`===== HOÀN THÀNH HOÀN TRẢ TỒN KHO =====`);
  } catch (error) {
    console.error(`Lỗi khi hoàn trả tồn kho: ${error.message}`);
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
    
    // Xử lý thay đổi trạng thái và cập nhật tồn kho
    const updatedOrder = await processOrderStatusChange(orderId, newStatus, cancelReason);
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: "Không thể cập nhật trạng thái đơn hàng", error: error.message });
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