const TypeProduct = require('../models/TypeProduct');

// Lấy danh sách loại sản phẩm
const getTypes = async (req, res) => {
    try {
        const types = await TypeProduct.find();
        res.render("dashboard/typeproduct", {
            title: "Danh Mục",
            page: "typeproduct",
            types,
          });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách loại sản phẩm' });
    }
};

// Lấy danh sách loại sản phẩm dưới dạng JSON
const getTypesAsJson = async (req, res) => {
    try {
        const types = await TypeProduct.find();
        res.status(200).json({
            status: 'Ok',
            data: types
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Thêm loại sản phẩm mới, kiểm tra trùng tên
const addType = async (req, res) => {
    try {
        console.log("Dữ liệu nhận được:", req.body);
        
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên loại sản phẩm là bắt buộc'
            });
        }
        
        // Kiểm tra xem loại sản phẩm đã tồn tại chưa
        const existingType = await TypeProduct.findOne({ name: name.trim() });
        if (existingType) {
            return res.status(400).json({
                status: 'Error',
                message: `Loại sản phẩm "${name}" đã tồn tại`
            });
        }
        
        // Nếu chưa tồn tại, tạo loại sản phẩm mới
        const newType = await TypeProduct.create({ name: name.trim() });
        
        res.status(201).json({
            status: 'Ok',
            message: 'Loại sản phẩm được tạo thành công',
            data: newType
        });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Cập nhật loại sản phẩm
const updateType = async (req, res) => {
    try {
        const { typeId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên loại sản phẩm là bắt buộc'
            });
        }

        // Kiểm tra xem tên mới đã tồn tại ở loại sản phẩm khác chưa
        const existingType = await TypeProduct.findOne({ 
            name: name.trim(),
            _id: { $ne: typeId } // Loại trừ chính nó khi kiểm tra
        });

        if (existingType) {
            return res.status(400).json({
                status: 'Error',
                message: `Loại sản phẩm "${name}" đã tồn tại`
            });
        }

        // Cập nhật loại sản phẩm
        const updatedType = await TypeProduct.findByIdAndUpdate(
            typeId,
            { name: name.trim() },
            { new: true } // Trả về document sau khi cập nhật
        );

        if (!updatedType) {
            return res.status(404).json({
                status: 'Error',
                message: 'Không tìm thấy loại sản phẩm'
            });
        }

        res.status(200).json({
            status: 'Ok',
            message: 'Loại sản phẩm đã được cập nhật',
            data: updatedType
        });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Xóa loại sản phẩm
const deleteType = async (req, res) => {
    try {
        const { typeId } = req.params;
        await TypeProduct.findByIdAndDelete(typeId);
        res.status(200).json({
            status: 'Ok',
            message: 'Loại sản phẩm đã được xóa'
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

module.exports = {
    getTypes,
    getTypesAsJson,
    addType,
    updateType,
    deleteType,
};