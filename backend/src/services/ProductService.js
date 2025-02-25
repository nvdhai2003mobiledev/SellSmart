const Product = require('../models/Product');

const addProduct = (newProduct) => {
    return new Promise(async (resolve, reject) => {
        const { name, price, thumbnail, description, category, stockQuantity, status } = newProduct;
        try {
            const checkProduct = await Product.findOne({ name });
            if (checkProduct) {
                resolve({
                    status: 'Error',
                    message: 'Product already exists',
                });
            }
            const createProduct = await Product.create({
                name,
                price,
                thumbnail,
                description,
                category,
                stockQuantity,
                status,
            });

            if (createProduct) {
                resolve({
                    status: 'Ok',
                    message: 'Product added successfully',
                    data: createProduct,
                });
            }
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Failed to add product',
                error: error.message,
            });
        }
    });
};

// Cập nhật sản phẩm
const updateProduct = (productId, updatedData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });
            if (!updatedProduct) {
                resolve({
                    status: 'Error',
                    message: 'Product not found',
                });
            } else {
                resolve({
                    status: 'Ok',
                    message: 'Product updated successfully',
                    data: updatedProduct,
                });
            }
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Failed to update product',
                error: error.message,
            });
        }
    });
};

// Xóa sản phẩm
const deleteProduct = (productId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deletedProduct = await Product.findByIdAndDelete(productId);
            if (!deletedProduct) {
                resolve({
                    status: 'Error',
                    message: 'Product not found',
                });
            } else {
                resolve({
                    status: 'Ok',
                    message: 'Product deleted successfully',
                    data: deletedProduct,
                });
            }
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Failed to delete product',
                error: error.message,
            });
        }
    });
};

module.exports = {
    addProduct,
    updateProduct,
    deleteProduct,
};
