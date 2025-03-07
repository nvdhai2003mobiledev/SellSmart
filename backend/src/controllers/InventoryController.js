const Inventory = require("../models/Inventory");

const importInventory = async (req, res) => {
  try {
    const { product_id, quantity, price, supplier_id, note } = req.body;

    if (!product_id || !quantity || !price) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const inventory = new Inventory({
      product_id,
      quantity,
      price,
      supplier_id,
      type: "import",
      employee_id: req.employee.id,
      status: "pending",
      note,
    });

    const importInventory = await inventory.save();

    // Consider removing console.log in production
    console.log(importInventory);

    res.status(201).json({
      message: "Nhập kho thành công",
      inventory: importInventory,
    });
  } catch (error) {
    console.error("Import inventory error:", error);
    res.status(500).json({
      message: "Lỗi server: " + error.message,
    });
  }
};

const exportInventory = async (req, res) => {
  try {
    const { product_id, quantity, price, supplier_id, note } = req.body;

    if (!product_id || !quantity || !price) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const inventory = new Inventory({
      product_id,
      quantity,
      price,
      supplier_id,
      type: "export",
      employee_id: req.employee.id,
      status: "pending",
      note,
    });

    const exportInventory = await inventory.save();

    // Consider removing console.log in production
    console.log(exportInventory);

    res.status(201).json({
      message: "Xuất kho thành công",
      inventory: exportInventory,
    });
  } catch (error) {
    console.error("Export inventory error:", error);
    res.status(500).json({
      message: "Lỗi server: " + error.message,
    });
  }
};

module.exports = {
  importInventory,
  exportInventory,
};
