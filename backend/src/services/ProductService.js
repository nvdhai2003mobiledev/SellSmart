const Product = require('../models/Product');

// Thêm sản phẩm mới
const addProduct = (newProduct) => {
    return new Promise(async (resolve, reject) => {
        const { name, price, thumbnail, description, category, stockQuantity, status, attributes } = newProduct;
        try {
            const checkProduct = await Product.findOne({ name });
            if (checkProduct) {
                return resolve({
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
                attributes // Thêm phần attributes vào
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
                return resolve({
                    status: 'Error',
                    message: 'Product not found',
                });
            } 
            resolve({
                status: 'Ok',
                message: 'Product updated successfully',
                data: updatedProduct,
            });
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
                return resolve({
                    status: 'Error',
                    message: 'Product not found',
                });
            } 
            resolve({
                status: 'Ok',
                message: 'Product deleted successfully',
                data: deletedProduct,
            });
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

const addProductVariant = (productId, newAttribute) => {
    return new Promise(async (resolve, reject) => {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return resolve({
                    status: 'Error',
                    message: 'Product not found',
                });
            }

            // Kiểm tra xem thuộc tính đã tồn tại chưa
            const existingAttribute = product.attributes.find(attr => attr.name === newAttribute.name);
            if (existingAttribute) {
                // Nếu thuộc tính đã có, thêm giá trị mới nếu chưa tồn tại
                newAttribute.values.forEach(value => {
                    if (!existingAttribute.values.includes(value)) {
                        existingAttribute.values.push(value);
                    }
                });
            } else {
                // Nếu thuộc tính chưa tồn tại, thêm mới
                product.attributes.push(newAttribute);
            }

            const updatedProduct = await product.save();
            resolve({
                status: 'Ok',
                message: 'Product variant added successfully',
                data: updatedProduct,
            });
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Failed to add product variant',
                error: error.message,
            });
        }
    });
};

module.exports = {
    addProduct,
    updateProduct,
    deleteProduct,
    addProductVariant,
};
