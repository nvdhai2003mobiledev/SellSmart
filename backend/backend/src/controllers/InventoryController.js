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
      expiry_date,
      note,
      price,
      quantity,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!product_name || !typeProduct_id || !provider_id) {
      console.log("Thiếu thông tin bắt buộc");
      return res.status(400).json({
        status: "Error",
        message: "Thiếu thông tin bắt buộc: tên sản phẩm, danh mục, nhà cung cấp",
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

    // Tạo hoặc kiểm tra mã sản phẩm
    let finalProductCode = product_code;
    if (!finalProductCode) {
      const lastInventory = await Inventory.findOne().sort({ product_code: -1 }).lean();
      const lastCode = lastInventory ? lastInventory.product_code : "MD00";
      const number = parseInt(lastCode.replace("MD", "")) + 1;
      finalProductCode = "MD" + number.toString().padStart(2, "0");
      console.log("Mã sản phẩm mới:", finalProductCode);
    }

    const existingProduct = await Inventory.findOne({ product_code: finalProductCode }).lean();
    if (existingProduct) {
      console.log("Mã sản phẩm đã tồn tại:", finalProductCode);
      return res.status(400).json({
        status: "Error",
        message: "Mã sản phẩm đã tồn tại",
      });
    }

    // Xử lý biến thể
    let processedVariantDetails = [];
    let totalQuantity = 0;
    let totalPrice = 0;

    if (hasVariants) {
      const variants = Array.isArray(variantDetails) ? variantDetails : [];
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

        processedVariantDetails.push({
          attributes,
          price: variantPrice,
          quantity: variantQuantity,
        });

        totalQuantity += variantQuantity;
        totalPrice += variantPrice * variantQuantity;
      }
    } else {
      const parsedPrice = Number(price);
      const parsedQuantity = Number(quantity);

      if (isNaN(parsedPrice) || isNaN(parsedQuantity) || parsedPrice <= 0 || parsedQuantity <= 0) {
        console.log("Giá hoặc số lượng không hợp lệ:", { price, quantity });
        return res.status(400).json({
          status: "Error",
          message: "Giá và số lượng phải là số dương",
        });
      }

      totalQuantity = parsedQuantity;
      totalPrice = parsedPrice * parsedQuantity;
    }

    // Kiểm tra employee_id
    const employee_id = req.employee?._id || (req.user?.role === "admin" ? req.user._id : null);
    if (!employee_id) {
      console.log("Không tìm thấy thông tin người dùng");
      return res.status(401).json({
        status: "Error",
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Tạo sản phẩm mới
    const inventory = new Inventory({
      product_name,
      product_code: finalProductCode,
      product_description: product_description || "",
      typeProduct_id,
      provider_id,
      hasVariants,
      variantDetails: processedVariantDetails,
      employee_id,
      status: totalQuantity > 0 ? "available" : "unavailable",
      type: "import",
      unit: unit || "cái",
      expiry_date: expiry_date ? new Date(expiry_date) : null,
      note: note || "",
      total_quantity: totalQuantity,
      total_price: totalPrice,
    });

    const savedInventory = await inventory.save();
    console.log("Sản phẩm đã được lưu:", savedInventory);

    res.status(201).json({
      status: "Ok",
      message: "Nhập kho thành công",
      data: savedInventory,
    });
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
    const { inventoryId } = req.params;
    const {
      product_name,
      product_code,
      product_description,
      typeProduct_id,
      provider_id,
      variantDetails,
      hasVariants,
      quantity,
      price,
      unit,
      expiry_date,
      note,
    } = req.body;

    const existingInventory = await Inventory.findById(inventoryId).lean();
    if (!existingInventory) {
      console.log("Sản phẩm không tồn tại:", inventoryId);
      return res.status(404).json({
        status: "Error",
        message: "Sản phẩm không tồn tại trong kho",
      });
    }

    if (product_code && product_code !== existingInventory.product_code) {
      const duplicateProduct = await Inventory.findOne({ product_code }).lean();
      if (duplicateProduct) {
        console.log("Mã sản phẩm đã tồn tại:", product_code);
        return res.status(400).json({
          status: "Error",
          message: "Mã sản phẩm đã tồn tại",
        });
      }
    }

    if (typeProduct_id) {
      const typeProduct = await TypeProduct.findById(typeProduct_id).lean();
      if (!typeProduct) {
        console.log("Danh mục không tồn tại:", typeProduct_id);
        return res.status(404).json({
          status: "Error",
          message: "Danh mục không tồn tại",
        });
      }
    }

    if (provider_id) {
      const provider = await Provider.findById(provider_id).lean();
      if (!provider) {
        console.log("Nhà cung cấp không tồn tại:", provider_id);
        return res.status(404).json({
          status: "Error",
          message: "Nhà cung cấp không tồn tại",
        });
      }
    }

    let processedVariantDetails = [];
    let totalQuantity = 0;
    let totalPrice = 0;

    if (hasVariants) {
      const variants = Array.isArray(variantDetails) ? variantDetails : [];
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

        processedVariantDetails.push({
          attributes,
          price: variantPrice,
          quantity: variantQuantity,
        });

        totalQuantity += variantQuantity;
        totalPrice += variantPrice * variantQuantity;
      }
    } else {
      const parsedPrice = Number(price);
      const parsedQuantity = Number(quantity);

      if (isNaN(parsedPrice) || isNaN(parsedQuantity) || parsedPrice <= 0 || parsedQuantity <= 0) {
        console.log("Giá hoặc số lượng không hợp lệ:", { price, quantity });
        return res.status(400).json({
          status: "Error",
          message: "Giá và số lượng phải là số dương",
        });
      }

      totalQuantity = parsedQuantity;
      totalPrice = parsedPrice * parsedQuantity;
    }

    const updatedInventory = await Inventory.findByIdAndUpdate(
      inventoryId,
      {
        product_name: product_name || existingInventory.product_name,
        product_code: product_code || existingInventory.product_code,
        product_description: product_description || "",
        typeProduct_id: typeProduct_id || existingInventory.typeProduct_id,
        provider_id: provider_id || existingInventory.provider_id,
        hasVariants: hasVariants !== undefined ? hasVariants : existingInventory.hasVariants,
        variantDetails: processedVariantDetails.length ? processedVariantDetails : existingInventory.variantDetails,
        unit: unit || existingInventory.unit,
        expiry_date: expiry_date ? new Date(expiry_date) : existingInventory.expiry_date,
        note: note || "",
        total_quantity: totalQuantity,
        total_price: totalPrice,
        status: totalQuantity > 0 ? "available" : "unavailable",
      },
      { new: true, runValidators: true }
    ).lean();

    console.log("Sản phẩm đã được cập nhật:", updatedInventory);

    res.status(200).json({
      status: "Ok",
      message: "Cập nhật sản phẩm thành công",
      data: updatedInventory,
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
    const [inventories, typeProducts, providers] = await Promise.all([
      Inventory.find()
        .populate({ path: "typeProduct_id", select: "name" })
        .populate({ path: "provider_id", select: "fullName" })
        .lean(),
      TypeProduct.find().lean(),
      Provider.find().lean(),
    ]);

    console.log("Số lượng sản phẩm tìm thấy:", inventories.length);

    if (!inventories.length) {
      return res.render("dashboard/inventory", {
        title: "Quản lý nhập kho",
        inventories: [],
        typeProducts,
        providers,
        message: "Không có sản phẩm nào trong kho",
      });
    }

    res.render("dashboard/inventory", {
      title: "Quản lý nhập kho",
      inventories,
      typeProducts,
      providers,
    });
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

    console.log("Sản phẩm tìm thấy:", inventory);
    res.status(200).json({
      status: "Ok",
      inventory,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết kho:", error);
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

module.exports = {
  importInventory,
  updateInventory,
  getInventoryList,
  getInventoryDetail,
  deleteInventory,
  getLastProductCode,
};