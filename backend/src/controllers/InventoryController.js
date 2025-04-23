const Inventory = require("../models/Inventory");
const TypeProduct = require("../models/TypeProduct");
const Provider = require("../models/Provider");
const mongoose = require("mongoose");

// Nhập kho sản phẩm mới
const importInventory = async (req, res) => {
  try {
    console.log("=== Bắt đầu xử lý nhập kho ===");
    console.log("Dữ liệu nhận được:", JSON.stringify(req.body, null, 2));

    const {
      product_name,
      product_code,
      product_description,
      typeProduct_id,
      provider_id,
      variantDetails,
      hasVariants,
      unit,
      note,
      price,
      quantity,
      batch_number,
      batch_date,
      is_batch_import, // Thêm trường này để xác định đây là nhập lô hàng mới
      original_product_id, // ID của sản phẩm gốc khi nhập lô hàng mới
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!product_name || !typeProduct_id || !provider_id || !batch_number) {
      console.log("Thiếu thông tin bắt buộc");
      return res.status(400).json({
        status: "Error",
        message: "Thiếu thông tin bắt buộc: tên sản phẩm, danh mục, nhà cung cấp, số lô hàng",
      });
    }

    // Kiểm tra danh mục tồn tại
    const typeProduct = await TypeProduct.findById(typeProduct_id);
    if (!typeProduct) {
      console.log("Danh mục không tồn tại:", typeProduct_id);
      return res.status(404).json({
        status: "Error",
        message: "Danh mục không tồn tại",
      });
    }

    // Kiểm tra nhà cung cấp tồn tại
    const provider = await Provider.findById(provider_id);
    if (!provider) {
      console.log("Nhà cung cấp không tồn tại:", provider_id);
      return res.status(404).json({
        status: "Error",
        message: "Nhà cung cấp không tồn tại",
      });
    }

    // Xử lý nhập lô hàng mới cho sản phẩm đã tồn tại
    if (is_batch_import && original_product_id) {
      console.log("Đang xử lý nhập lô hàng mới cho sản phẩm đã tồn tại:", original_product_id);
      console.log("Dữ liệu nhận được:", {
        batch_number,
        batch_date,
        hasVariants,
        variantDetails: JSON.stringify(variantDetails),
        price,
        quantity
      });
      
      // Tìm sản phẩm gốc
      const originalProduct = await Inventory.findById(original_product_id);
      if (!originalProduct) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy sản phẩm gốc",
        });
      }

      // Kiểm tra xem lô hàng này đã tồn tại chưa
      const existingBatch = originalProduct.batch_info && originalProduct.batch_info.find(b => b.batch_number === batch_number);

      if (existingBatch) {
        console.log("Lô hàng này đã tồn tại cho sản phẩm này:", batch_number);
        return res.status(400).json({
          status: "Error",
          message: "Lô hàng này đã tồn tại cho sản phẩm này",
        });
      }

      // Xử lý biến thể
      let newTotalQuantity = 0;
      let newTotalPrice = 0;

      if (hasVariants) {
        console.log("Xử lý sản phẩm có biến thể");
        console.log("variantDetails trước khi xử lý:", JSON.stringify(variantDetails));
        
        // Đảm bảo variantDetails là một mảng
        let variants = Array.isArray(variantDetails) ? variantDetails : 
                      (typeof variantDetails === 'string' ? JSON.parse(variantDetails) : []);
        
        console.log("variants sau khi xử lý:", JSON.stringify(variants));
        
        if (!variants.length) {
          console.log("Danh sách biến thể trống");
          return res.status(400).json({
            status: "Error",
            message: "Danh sách biến thể không được để trống khi có biến thể",
          });
        }

        // Cập nhật biến thể
        for (const variant of variants) {
          const { attributes, price, quantity } = variant;
          const variantPrice = Number(price);
          const variantQuantity = Number(quantity);

          if (isNaN(variantPrice) || isNaN(variantQuantity) || variantPrice <= 0 || variantQuantity <= 0) {
            return res.status(400).json({
              status: "Error",
              message: "Giá và số lượng biến thể phải là số dương",
            });
          }

          // Kiểm tra cấu trúc của attributes từ variantDetails
          if (attributes && typeof attributes === 'object') {
            // Đảm bảo attributes là đúng định dạng
            const attributeKeys = Object.keys(attributes);
            console.log("Các key của attributes:", attributeKeys);
            
            // Kiểm tra xem có phải là object rỗng không
            if (attributeKeys.length === 0) {
              console.log("Attributes là object rỗng, không thể so sánh");
            }
          } else {
            console.log("Attributes không phải là object:", typeof attributes);
          }
          
          // Tìm biến thể tương ứng trong sản phẩm gốc
          console.log("Đang tìm biến thể tương ứng với:", JSON.stringify(attributes));
          console.log("Danh sách biến thể hiện có:", JSON.stringify(originalProduct.variantDetails));
          
          const existingVariantIndex = originalProduct.variantDetails ? 
            originalProduct.variantDetails.findIndex(v => {
              // So sánh thuộc tính một cách chính xác hơn
              if (!v.attributes || !attributes) {
                console.log("Thiếu thuộc tính để so sánh");
                return false;
              }
              
              console.log("So sánh thuộc tính:", JSON.stringify(v.attributes), "với", JSON.stringify(attributes));
              
              // Kiểm tra nếu attributes là Map
              if (v.attributes instanceof Map) {
                console.log("Thuộc tính là Map, chuyển đổi để so sánh");
                // Chuyển Map thành object để so sánh
                const vAttrs = {};
                for (const [key, value] of v.attributes.entries()) {
                  vAttrs[key] = value;
                }
                
                // So sánh các key và value
                const vKeys = Object.keys(vAttrs);
                const attrKeys = Object.keys(attributes);
                
                console.log("So sánh keys:", vKeys, "với", attrKeys);
                
                if (vKeys.length !== attrKeys.length) {
                  console.log("Số lượng keys khác nhau");
                  return false;
                }
                
                const result = vKeys.every(key => vAttrs[key] === attributes[key]);
                console.log("Kết quả so sánh:", result);
                return result;
              } else {
                // Nếu là object thông thường
                const vKeys = Object.keys(v.attributes);
                const attrKeys = Object.keys(attributes);
                
                console.log("So sánh keys (object):", vKeys, "với", attrKeys);
                
                if (vKeys.length !== attrKeys.length) {
                  console.log("Số lượng keys khác nhau (object)");
                  return false;
                }
                
                const result = vKeys.every(key => {
                  console.log(`So sánh ${key}:`, v.attributes[key], "với", attributes[key]);
                  return v.attributes[key] === attributes[key];
                });
                console.log("Kết quả so sánh (object):", result);
                return result;
              }
            }) : -1;
          
          console.log("Kết quả tìm biến thể:", existingVariantIndex);

          if (existingVariantIndex !== -1) {
            // Cập nhật biến thể đã tồn tại
            const existingVariant = originalProduct.variantDetails[existingVariantIndex];
            const oldQuantity = existingVariant.quantity || 0;
            const oldPrice = existingVariant.price || 0;
            const newQuantity = oldQuantity + variantQuantity;
            
            // Tính giá trung bình theo công thức: (oldPrice * oldQuantity + newPrice * newQuantity) / totalQuantity
            const newPrice = (oldPrice * oldQuantity + variantPrice * variantQuantity) / newQuantity;
            
            console.log(`Cập nhật biến thể: Số lượng cũ=${oldQuantity}, Giá cũ=${oldPrice}, Số lượng mới=${newQuantity}, Giá mới=${newPrice}`);
            
            originalProduct.variantDetails[existingVariantIndex].quantity = newQuantity;
            originalProduct.variantDetails[existingVariantIndex].price = newPrice;
          } else {
            // Thêm biến thể mới
            if (!originalProduct.variantDetails) {
              originalProduct.variantDetails = [];
            }
            
            originalProduct.variantDetails.push({
              attributes,
              price: variantPrice,
              quantity: variantQuantity,
            });
          }
        }

        // Tính lại tổng số lượng và tổng giá
        newTotalQuantity = originalProduct.variantDetails.reduce((sum, v) => sum + (v.quantity || 0), 0);
        newTotalPrice = originalProduct.variantDetails.reduce((sum, v) => sum + ((v.price || 0) * (v.quantity || 0)), 0);
      } else {
        // Sản phẩm không có biến thể
        const newPrice = Number(price);
        const newQuantity = Number(quantity);

        if (isNaN(newPrice) || isNaN(newQuantity) || newPrice <= 0 || newQuantity <= 0) {
          return res.status(400).json({
            status: "Error",
            message: "Giá và số lượng phải là số dương",
          });
        }

        // Cập nhật tổng số lượng và tổng giá
        const oldQuantity = originalProduct.total_quantity || 0;
        const oldPrice = originalProduct.total_price || 0;
        
        newTotalQuantity = oldQuantity + newQuantity;
        
        // Tính giá trung bình theo công thức: (oldPrice * oldQuantity + newPrice * newQuantity) / totalQuantity
        if (oldQuantity > 0) {
          newTotalPrice = (oldPrice * oldQuantity + newPrice * newQuantity) / newTotalQuantity;
        } else {
          newTotalPrice = newPrice * newQuantity;
        }
        
        console.log(`Cập nhật sản phẩm: Số lượng cũ=${oldQuantity}, Tổng giá cũ=${oldPrice}, Số lượng mới=${newTotalQuantity}, Tổng giá mới=${newTotalPrice}`);
      }

      // Cập nhật thông tin lô hàng
      if (!originalProduct.batch_info) {
        originalProduct.batch_info = [];
      }
      
      const newBatchInfo = {
        batch_number,
        batch_date,
        quantity: hasVariants ? 0 : Number(quantity),
        price: hasVariants ? 0 : Number(price),
        note,
        created_at: new Date(),
      };
      
      console.log("Thêm thông tin lô hàng mới:", JSON.stringify(newBatchInfo));
      originalProduct.batch_info.push(newBatchInfo);

      // Cập nhật tổng số lượng và tổng giá
      originalProduct.total_quantity = newTotalQuantity;
      originalProduct.total_price = newTotalPrice;

      // Lưu sản phẩm đã cập nhật
      try {
        await originalProduct.save();
        console.log("Đã cập nhật sản phẩm với lô hàng mới:", originalProduct);
        return res.status(200).json({
          status: "Ok",
          message: "Nhập lô hàng mới thành công",
          inventory: originalProduct,
        });
      } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);
        return res.status(500).json({
          status: "Error",
          message: "Lỗi khi lưu sản phẩm: " + error.message,
        });
      }
    }

    // Xử lý nhập sản phẩm mới (không phải nhập lô hàng mới)
    try {
      console.log("=== Bắt đầu xử lý nhập sản phẩm mới ===");
      let finalProductCode = product_code;
      if (!finalProductCode) {
        const lastInventory = await Inventory.findOne().sort({ product_code: -1 }).lean();
        const lastCode = lastInventory ? lastInventory.product_code : "MD00";
        const number = parseInt(lastCode.replace("MD", "")) + 1;
        finalProductCode = "MD" + number.toString().padStart(2, "0");
        console.log("Mã sản phẩm mới:", finalProductCode);
      }

      // Kiểm tra xem sản phẩm đã tồn tại chưa (chỉ kiểm tra khi nhập sản phẩm mới, không kiểm tra khi nhập lô hàng mới)
      const existingProduct = await Inventory.findOne({
        product_code: finalProductCode,
      }).lean();

      if (existingProduct) {
        console.log("Mã sản phẩm đã tồn tại:", finalProductCode);
        return res.status(400).json({
          status: "Error",
          message: "Mã sản phẩm đã tồn tại",
        });
      }

      // Kiểm tra xem sản phẩm với lô hàng này đã tồn tại chưa
      const existingBatch = await Inventory.findOne({
        product_name: product_name,
        typeProduct_id: typeProduct_id,
        provider_id: provider_id,
        batch_number: batch_number,
      }).lean();

      if (existingBatch) {
        console.log("Sản phẩm với lô hàng này đã tồn tại:", batch_number);
        return res.status(400).json({
          status: "Error",
          message: "Sản phẩm với lô hàng này đã tồn tại",
        });
      }

      // Xử lý biến thể
      let processedVariantDetails = [];
      let totalQuantity = 0;
      let totalPrice = 0;

      if (hasVariants) {
        console.log("Xử lý sản phẩm có biến thể");
        console.log("variantDetails trước khi xử lý:", JSON.stringify(variantDetails));
        
        // Đảm bảo variantDetails là một mảng
        let variants = Array.isArray(variantDetails) ? variantDetails : 
                      (typeof variantDetails === 'string' ? JSON.parse(variantDetails) : []);
        
        console.log("variants sau khi xử lý:", JSON.stringify(variants));
        
        if (!variants.length) {
          console.log("Danh sách biến thể trống");
          return res.status(400).json({
            status: "Error",
            message: "Danh sách biến thể không được để trống khi có biến thể",
          });
        }

        for (const [index, variant] of variants.entries()) {
          if (!variant?.attributes || typeof variant.attributes !== "object" || Object.keys(variant.attributes).length === 0) {
            console.log(`Biến thể ${index + 1} không hợp lệ:`, variant);
            return res.status(400).json({
              status: "Error",
              message: `Biến thể ${index + 1} không hợp lệ: thiếu hoặc sai định dạng thuộc tính`,
            });
          }

          const { attributes, price, quantity } = variant;

          const variantPrice = Number(price);
          const variantQuantity = Number(quantity);

          if (isNaN(variantPrice) || isNaN(variantQuantity) || variantPrice <= 0 || variantQuantity <= 0) {
            console.log(`Biến thể ${index + 1} có giá hoặc số lượng không hợp lệ:`, { price, quantity });
            return res.status(400).json({
              status: "Error",
              message: `Biến thể ${index + 1}: Giá và số lượng phải là số dương`,
            });
          }

          // Chuyển đổi attributes từ object thành Map
          const attributesMap = new Map();
          for (const [key, value] of Object.entries(attributes)) {
            attributesMap.set(key, value);
          }

          processedVariantDetails.push({
            attributes: attributesMap,
            price: variantPrice,
            quantity: variantQuantity,
          });

          totalQuantity += variantQuantity;
          totalPrice += variantPrice * variantQuantity;
        }
      } else {
        // Sản phẩm không có biến thể
        const itemPrice = Number(price);
        const itemQuantity = Number(quantity);

        if (isNaN(itemPrice) || isNaN(itemQuantity) || itemPrice <= 0 || itemQuantity <= 0) {
          console.log("Giá hoặc số lượng không hợp lệ:", { price, quantity });
          return res.status(400).json({
            status: "Error",
            message: "Giá và số lượng phải là số dương",
          });
        }

        totalQuantity = itemQuantity;
        totalPrice = itemPrice * itemQuantity;
      }

      // Tạo sản phẩm mới
      const newInventory = new Inventory({
        product_name,
        product_code: finalProductCode,
        product_description: product_description || "",
        typeProduct_id,
        provider_id,
        hasVariants,
        variantDetails: processedVariantDetails,
        total_quantity: totalQuantity,
        total_price: totalPrice,
        employee_id: req.user ? req.user.id : null, // Kiểm tra nếu req.user tồn tại
        status: totalQuantity > 0 ? "available" : "unavailable",
        type: "import", // Loại giao dịch là nhập kho
        unit: unit || "cái",
        note: note || "",
        batch_number,
        batch_date: batch_date || new Date(),
      });

      // Thêm thông tin lô hàng
      if (!newInventory.batch_info) {
        newInventory.batch_info = [];
      }
      
      const newBatchInfo = {
        batch_number,
        batch_date: batch_date || new Date(),
        quantity: hasVariants ? 0 : Number(quantity),
        price: hasVariants ? 0 : Number(price),
        note: note || "",
        created_at: new Date(),
      };
      
      console.log("Thêm thông tin lô hàng mới cho sản phẩm mới:", JSON.stringify(newBatchInfo));
      newInventory.batch_info.push(newBatchInfo);

      await newInventory.save();
      console.log("Đã lưu sản phẩm mới:", newInventory._id);

      res.status(201).json({
        status: "Ok",
        message: "Nhập kho sản phẩm thành công",
        data: newInventory,
      });
    } catch (error) {
      console.error("Lỗi khi nhập sản phẩm mới:", error);
      res.status(500).json({
        status: "Error",
        message: `Lỗi server: ${error.message}`,
      });
    }
  } catch (error) {
    console.error("Lỗi khi nhập kho:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Cập nhật sản phẩm trong kho
const updateInventory = async (req, res) => {
  try {
    console.log("=== Bắt đầu xử lý cập nhật kho ===");
    console.log("Dữ liệu nhận được:", JSON.stringify(req.body, null, 2));

    const { id } = req.params;
    const {
      product_name,
      product_code,
      product_description,
      typeProduct_id,
      provider_id,
      variantDetails,
      hasVariants,
      unit,
      note,
      price,
      quantity,
      batch_number,
      batch_date,
    } = req.body;

    // Kiểm tra sản phẩm tồn tại
    const inventory = await Inventory.findById(id);
    if (!inventory) {
      console.log("Không tìm thấy sản phẩm:", id);
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm trong kho",
      });
    }

    // Kiểm tra các trường bắt buộc
    if (!product_name || !typeProduct_id || !provider_id || !batch_number) {
      console.log("Thiếu thông tin bắt buộc");
      return res.status(400).json({
        status: "Error",
        message: "Thiếu thông tin bắt buộc: tên sản phẩm, danh mục, nhà cung cấp, số lô hàng",
      });
    }
    // Kiểm tra danh mục tồn tại
    const typeProduct = await TypeProduct.findById(typeProduct_id);
    if (!typeProduct) {
      console.log("Danh mục không tồn tại:", typeProduct_id);
      return res.status(404).json({
        status: "Error",
        message: "Danh mục không tồn tại",
      });
    }

    // Kiểm tra nhà cung cấp tồn tại
    const provider = await Provider.findById(provider_id);
    if (!provider) {
      console.log("Nhà cung cấp không tồn tại:", provider_id);
      return res.status(404).json({
        status: "Error",
        message: "Nhà cung cấp không tồn tại",
      });
    }

    // Kiểm tra mã sản phẩm nếu thay đổi
    if (product_code !== inventory.product_code) {
      const existingCode = await Inventory.findOne({ product_code, _id: { $ne: id } }).lean();
      if (existingCode) {
        console.log("Mã sản phẩm đã tồn tại:", product_code);
        return res.status(400).json({
          status: "Error",
          message: "Mã sản phẩm đã tồn tại",
        });
      }
    }

    // Kiểm tra xem sản phẩm với lô hàng này đã tồn tại chưa (nếu thay đổi lô hàng)
    if (batch_number !== inventory.batch_number) {
      const existingBatch = await Inventory.findOne({
        product_name,
        typeProduct_id,
        provider_id,
        batch_number,
        _id: { $ne: id },
      }).lean();

      if (existingBatch) {
        console.log("Sản phẩm với lô hàng này đã tồn tại:", batch_number);
        return res.status(400).json({
          status: "Error",
          message: "Sản phẩm với lô hàng này đã tồn tại",
        });
      }
    }

    // Xử lý biến thể
    let processedVariantDetails = [];
    let totalQuantity = 0;
    let totalPrice = 0;

    if (hasVariants) {
      console.log("Xử lý sản phẩm có biến thể");
      console.log("variantDetails trước khi xử lý:", JSON.stringify(variantDetails));
      
      // Đảm bảo variantDetails là một mảng
      let variants = Array.isArray(variantDetails) ? variantDetails : 
                      (typeof variantDetails === 'string' ? JSON.parse(variantDetails) : []);
      
      console.log("variants sau khi xử lý:", JSON.stringify(variants));
      
      if (!variants.length) {
        console.log("Danh sách biến thể trống");
        return res.status(400).json({
          status: "Error",
          message: "Danh sách biến thể không được để trống khi có biến thể",
        });
      }

      for (const [index, variant] of variants.entries()) {
        if (!variant?.attributes || typeof variant.attributes !== "object" || Object.keys(variant.attributes).length === 0) {
          console.log(`Biến thể ${index + 1} không hợp lệ:`, variant);
          return res.status(400).json({
            status: "Error",
            message: `Biến thể ${index + 1} không hợp lệ: thiếu hoặc sai định dạng thuộc tính`,
          });
        }

        const { attributes, price, quantity } = variant;

        const variantPrice = Number(price);
        const variantQuantity = Number(quantity);

        if (isNaN(variantPrice) || isNaN(variantQuantity) || variantPrice <= 0 || variantQuantity <= 0) {
          console.log(`Biến thể ${index + 1} có giá hoặc số lượng không hợp lệ:`, { price, quantity });
          return res.status(400).json({
            status: "Error",
            message: `Biến thể ${index + 1}: Giá và số lượng phải là số dương`,
          });
        }

        // Chuyển đổi attributes từ object thành Map
        const attributesMap = new Map();
        for (const [key, value] of Object.entries(attributes)) {
          attributesMap.set(key, value);
        }

        processedVariantDetails.push({
          attributes: attributesMap,
          price: variantPrice,
          quantity: variantQuantity,
        });

        totalQuantity += variantQuantity;
        totalPrice += variantPrice * variantQuantity;
      }
    } else {
      // Xử lý sản phẩm không có biến thể
      const itemPrice = Number(price);
      const itemQuantity = Number(quantity);

      if (isNaN(itemPrice) || isNaN(itemQuantity) || itemPrice <= 0 || itemQuantity <= 0) {
        console.log("Giá hoặc số lượng không hợp lệ:", { price, quantity });
        return res.status(400).json({
          status: "Error",
          message: "Giá và số lượng phải là số dương",
        });
      }

      totalQuantity = itemQuantity;
      totalPrice = itemPrice * itemQuantity;
    }

    // Cập nhật sản phẩm
    inventory.product_name = product_name;
    inventory.product_code = product_code;
    inventory.product_description = product_description || "";
    inventory.typeProduct_id = typeProduct_id;
    inventory.provider_id = provider_id;
    inventory.hasVariants = hasVariants;
    inventory.variantDetails = processedVariantDetails;
    inventory.total_quantity = totalQuantity;
    inventory.total_price = totalPrice;
    inventory.status = totalQuantity > 0 ? "available" : "unavailable";
    inventory.unit = unit || "cái";
    inventory.note = note || "";
    inventory.batch_number = batch_number;
    inventory.batch_date = batch_date || inventory.batch_date;

    await inventory.save();
    console.log("Đã cập nhật sản phẩm:", id);

    res.status(200).json({
      status: "Ok",
      message: "Cập nhật sản phẩm thành công",
      data: inventory,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật kho:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Lấy danh sách sản phẩm trong kho
const getInventoryList = async (req, res) => {
  try {
    console.log("=== Bắt đầu lấy danh sách kho ===");

    // Lấy danh sách sản phẩm từ database
    const inventories = await Inventory.find()
      .populate({ path: "typeProduct_id", select: "name" })
      .populate({ path: "provider_id", select: "fullName" })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Tìm thấy ${inventories.length} sản phẩm`);

    // Lấy danh mục và nhà cung cấp cho form
    const typeProducts = await TypeProduct.find().lean();
    const providers = await Provider.find().lean();

    // Kiểm tra nếu request muốn JSON
    if (req.headers.accept === 'application/json' || req.path.includes('/json')) {
      console.log("Trả về danh sách sản phẩm dạng JSON");
      return res.json({
        status: "Ok",
        data: inventories
      });
    }

    // Chuẩn bị dữ liệu cho template
    const templateData = {
      title: "Quản lý nhập kho",
      page: "inventory",
      inventories: inventories || [],
      typeProducts,
      providers,
      admin: {
        fullName: req.user?.fullName || 'Admin',
        avatar: req.user?.avatar || null
      },
      user: {
        fullName: req.user?.fullName || 'Admin',
        avatar: req.user?.avatar || null
      }
    };

    // Thêm thông báo nếu không có sản phẩm
    if (!inventories.length) {
      templateData.message = "Không có sản phẩm nào trong kho";
    }

    console.log("Render trang inventory với admin:", templateData.admin);
    res.render("dashboard/inventory", templateData);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách kho:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Lấy chi tiết sản phẩm trong kho
const getInventoryDetail = async (req, res) => {
  try {
    console.log("=== Bắt đầu lấy chi tiết kho ===");
    const id = req.params.id;
    console.log("ID sản phẩm:", id);

    // Sử dụng lean() để chuyển đổi document thành plain JavaScript object
    const inventory = await Inventory.findById(id)
      .populate({ path: "typeProduct_id", select: "name" })
      .populate({ path: "provider_id", select: "fullName" })
      .lean();
      
    // Đảm bảo variantDetails được trả về đầy đủ
    if (inventory && inventory.variantDetails) {
      // Chuyển đổi Map attributes thành object JavaScript thông thường
      inventory.variantDetails = inventory.variantDetails.map(variant => {
        let attrs = {};
        if (variant.attributes) {
          if (variant.attributes instanceof Map) {
            for (const [key, value] of variant.attributes.entries()) {
              attrs[key] = value;
            }
          } else if (typeof variant.attributes === 'object') {
            attrs = variant.attributes;
          }
        }
        
        return {
          ...variant,
          attributes: attrs
        };
      });
      
      console.log('variantDetails sau khi xử lý:', JSON.stringify(inventory.variantDetails, null, 2));
    }

    if (!inventory) {
      console.log("Không tìm thấy sản phẩm với ID:", id);
      return res.status(404).json({
        status: "Error",
        message: "Sản phẩm không tồn tại trong kho",
      });
    }

    // Kiểm tra nếu request muốn JSON
    if (req.headers.accept === 'application/json') {
      console.log("Trả về chi tiết sản phẩm dạng JSON");
      return res.status(200).json({
        status: "Ok",
        inventory,
      });
    }

    // Nếu không, render trang chi tiết
    console.log("Render trang chi tiết sản phẩm");
    res.render("dashboard/inventory-detail", {
      inventory,
      title: "Chi tiết sản phẩm",
      page: "inventory",
      admin: {
        fullName: req.user?.fullName || 'Admin',
        avatar: req.user?.avatar || null
      },
      user: {
        fullName: req.user?.fullName || 'Admin',
        avatar: req.user?.avatar || null
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết kho:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Lấy danh sách sản phẩm theo lô hàng
const getInventoryByBatch = async (req, res) => {
  try {
    console.log("=== Bắt đầu lấy danh sách sản phẩm theo lô hàng ===");
    const { batch_number } = req.params;
    
    if (!batch_number) {
      return res.status(400).json({
        status: "Error",
        message: "Số lô hàng là bắt buộc",
      });
    }
    
    const inventories = await Inventory.find({ batch_number })
      .populate({ path: "typeProduct_id", select: "name" })
      .populate({ path: "provider_id", select: "fullName" })
      .sort({ createdAt: -1 })
      .lean();
      
    console.log(`Tìm thấy ${inventories.length} sản phẩm thuộc lô hàng ${batch_number}`);
    
    res.status(200).json({
      status: "Ok",
      data: inventories,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm theo lô hàng:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Xóa sản phẩm khỏi kho
const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await Inventory.findByIdAndDelete(id).lean();
    if (!inventory) {
      console.log("Không tìm thấy sản phẩm:", id);
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm trong kho",
      });
    }

    console.log("Đã xóa sản phẩm:", id);
    res.status(200).json({
      status: "Ok",
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Lấy mã sản phẩm cuối cùng
const getLastProductCode = async (req, res) => {
  try {
    const lastInventory = await Inventory.findOne().sort({ product_code: -1 }).lean();
    const lastCode = lastInventory ? lastInventory.product_code : "MD00";
    console.log("Mã sản phẩm cuối cùng:", lastCode);
    res.status(200).json({
      status: "Ok",
      data: lastCode,
    });
  } catch (error) {
    console.error("Lỗi khi lấy mã sản phẩm cuối cùng:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Lấy danh sách sản phẩm duy nhất cho nhập lô hàng mới
const getProductsForBatch = async (req, res) => {
  try {
    console.log("=== Bắt đầu lấy danh sách sản phẩm cho nhập lô hàng mới ===");
    
    // Tìm các sản phẩm duy nhất dựa trên tên, danh mục và nhà cung cấp
    const products = await Inventory.aggregate([
      {
        $group: {
          _id: {
            product_name: "$product_name",
            typeProduct_id: "$typeProduct_id",
            provider_id: "$provider_id",
            hasVariants: "$hasVariants"
          },
          product_id: { $first: "$_id" },
          product_name: { $first: "$product_name" },
          product_code: { $first: "$product_code" },
          product_description: { $first: "$product_description" },
          typeProduct_id: { $first: "$typeProduct_id" },
          provider_id: { $first: "$provider_id" },
          hasVariants: { $first: "$hasVariants" },
          unit: { $first: "$unit" },
          variantDetails: { $first: "$variantDetails" }
        }
      },
      {
        $lookup: {
          from: "typeproducts",
          localField: "typeProduct_id",
          foreignField: "_id",
          as: "typeProduct"
        }
      },
      {
        $lookup: {
          from: "providers",
          localField: "provider_id",
          foreignField: "_id",
          as: "provider"
        }
      },
      {
        $project: {
          _id: "$product_id",
          product_name: 1,
          product_code: 1,
          product_description: 1,
          typeProduct_id: 1,
          provider_id: 1,
          hasVariants: 1,
          unit: 1,
          variantDetails: 1,
          typeProduct_name: { $arrayElemAt: ["$typeProduct.name", 0] },
          provider_name: { $arrayElemAt: ["$provider.fullName", 0] }
        }
      },
      { $sort: { product_name: 1 } }
    ]);
    
    console.log(`Tìm thấy ${products.length} sản phẩm duy nhất`);
    
    res.status(200).json({
      status: "Ok",
      data: products,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm cho nhập lô hàng mới:", error);
    res.status(500).json({
      status: "Error",
      message: `Lỗi server: ${error.message}`,
    });
  }
};

// Add a new controller function for getting available inventory items for product selection
const getAvailableInventory = async (req, res) => {
  try {
    console.log('Fetching available inventory items for product selection');
    
    // Create the query with explicit conditions
    const query = { 
      status: { $eq: "available" }, // Use $eq operator to ensure string comparison
      // Only get items with positive quantity
      $or: [
        { total_quantity: { $gt: 0 } }, // For non-variant products
        { "variantDetails.quantity": { $gt: 0 } } // For products with variants
      ]
    };
    
    console.log('Query structure:', JSON.stringify(query));
    
    // Find all available inventory items - use explicit string comparison for status
    const availableInventory = await Inventory.find(query)
      .populate('typeProduct_id')
      .populate('provider_id')
      .lean();
    
    console.log(`Found ${availableInventory.length} available inventory items`);
    
    // Get the Product model and find related products for thumbnails
    try {
      const Product = mongoose.model('Product');
      
      if (Product) {
        // Find all products that reference these inventory items
        const inventoryIds = availableInventory.map(item => item._id);
        const relatedProducts = await Product.find({ 
          inventoryId: { $in: inventoryIds } 
        }).lean();
        
        console.log(`Found ${relatedProducts.length} related products with thumbnails`);
        
        // Add thumbnail information to inventory items
        availableInventory.forEach(inventory => {
          const relatedProduct = relatedProducts.find(
            p => p.inventoryId && p.inventoryId.toString() === inventory._id.toString()
          );
          
          if (relatedProduct && relatedProduct.thumbnail) {
            inventory.productThumbnail = relatedProduct.thumbnail;
          }
        });
      }
    } catch (productError) {
      console.error('Error fetching related product data:', productError);
      // Continue without product thumbnails
    }
    
    // If we found items, log the first one for debugging
    if (availableInventory.length > 0) {
      const sample = availableInventory[0];
      console.log('Sample inventory item:', {
        id: sample._id,
        name: sample.product_name,
        status: sample.status,
        hasVariants: sample.hasVariants,
        variantCount: sample.variantDetails?.length || 0,
        thumbnail: sample.productThumbnail || 'None'
      });
    }
    
    // Send the response
    res.status(200).json({
      status: "Success",
      message: "Available inventory items retrieved successfully",
      data: availableInventory
    });
  } catch (error) {
    console.error('Error fetching available inventory:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a MongoDB casting error
    if (error.name === 'CastError') {
      console.error('MongoDB Cast Error Details:', {
        kind: error.kind,
        path: error.path,
        value: error.value,
        model: error.model?.modelName || 'Unknown'
      });
    }
    
    res.status(500).json({
      status: "Error",
      message: "Failed to retrieve available inventory items",
      error: error.message
    });
  }
};

module.exports = {
  importInventory,
  updateInventory,
  getInventoryList,
  getInventoryDetail,
  getInventoryByBatch,
  deleteInventory,
  getLastProductCode,
  getProductsForBatch,
  getAvailableInventory
};