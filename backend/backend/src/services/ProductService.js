const Product = require('../models/Product');
const Variant = require('../models/Variant');
const DetailsVariant = require('../models/DetailsVariant');

// Thêm sản phẩm mới
const addProduct = (newProduct) => {
    return new Promise(async (resolve, reject) => {
        const { name, price, thumbnail, description, brand, category, inventory, status, attributes } = newProduct;
        try {
            const checkProduct = await Product.findOne({ name });
            if (checkProduct) {
                return resolve({
                    status: 'Error',
                    message: 'Sản phẩm đã tồn tại',
                });
            }
            
            // Kiểm tra xem có attributes không
            let hasVariants = false;
            let processedAttributes = [];
            
            if (attributes && attributes.length > 0) {
                hasVariants = true;
                
                // Xử lý từng thuộc tính
                for (const attr of attributes) {
                    // Kiểm tra xem đã có Variant cho thuộc tính này chưa
                    let variant = await Variant.findOne({ name: attr.name });
                    
                    if (!variant) {
                        // Tạo mới Variant nếu chưa tồn tại
                        variant = await Variant.create({
                            name: attr.name,
                            values: attr.values
                        });
                    } else {
                        // Cập nhật thêm giá trị mới vào Variant nếu cần
                        let updatedValues = [...variant.values];
                        
                        for (const value of attr.values) {
                            if (!updatedValues.includes(value)) {
                                updatedValues.push(value);
                            }
                        }
                        
                        if (updatedValues.length > variant.values.length) {
                            variant.values = updatedValues;
                            await variant.save();
                        }
                    }
                    
                    // Thêm variantId vào thuộc tính
                    processedAttributes.push({
                        name: attr.name,
                        values: attr.values,
                        variantId: variant._id
                    });
                }
            }
            
            const createProduct = await Product.create({
                name,
                price,
                thumbnail,
                description,
                brand,
                category,
                inventory,
                status,
                attributes: processedAttributes,
                hasVariants
            });

            if (createProduct) {
                resolve({
                    status: 'Ok',
                    message: 'Thêm sản phẩm thành công',
                    data: createProduct,
                });
            }
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Không thể thêm sản phẩm',
                error: error.message,
            });
        }
    });
};

// Cập nhật sản phẩm
const updateProduct = (productId, updatedData) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Xử lý thuộc tính nếu có
            if (updatedData.attributes && updatedData.attributes.length > 0) {
                updatedData.hasVariants = true;
                
                // Xử lý từng thuộc tính
                const processedAttributes = [];
                for (const attr of updatedData.attributes) {
                    // Kiểm tra xem đã có Variant cho thuộc tính này chưa
                    let variant = await Variant.findOne({ name: attr.name });
                    
                    if (!variant) {
                        // Tạo mới Variant nếu chưa tồn tại
                        variant = await Variant.create({
                            name: attr.name,
                            values: attr.values
                        });
                    } else {
                        // Cập nhật thêm giá trị mới vào Variant nếu cần
                        let updatedValues = [...variant.values];
                        
                        for (const value of attr.values) {
                            if (!updatedValues.includes(value)) {
                                updatedValues.push(value);
                            }
                        }
                        
                        if (updatedValues.length > variant.values.length) {
                            variant.values = updatedValues;
                            await variant.save();
                        }
                    }
                    
                    // Thêm variantId vào thuộc tính
                    processedAttributes.push({
                        name: attr.name,
                        values: attr.values,
                        variantId: variant._id
                    });
                }
                
                updatedData.attributes = processedAttributes;
            } else if (updatedData.attributes && updatedData.attributes.length === 0) {
                updatedData.hasVariants = false;
            }

            const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });
            if (!updatedProduct) {
                return resolve({
                    status: 'Error',
                    message: 'Không tìm thấy sản phẩm',
                });
            }
            
            resolve({
                status: 'Ok',
                message: 'Cập nhật sản phẩm thành công',
                data: updatedProduct,
            });
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Không thể cập nhật sản phẩm',
                error: error.message,
            });
        }
    });
};

// Xóa sản phẩm
const deleteProduct = (productId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Tìm sản phẩm
            const product = await Product.findById(productId);
            if (!product) {
                return resolve({
                    status: 'Error',
                    message: 'Không tìm thấy sản phẩm',
                });
            }

            // Xóa tất cả chi tiết biến thể liên quan đến sản phẩm
            if (product.hasVariants && product.attributes && product.attributes.length > 0) {
                for (const attr of product.attributes) {
                    if (attr.variantId) {
                        // Xóa chi tiết biến thể
                        await DetailsVariant.deleteMany({
                            variantId: attr.variantId,
                            value: { $in: attr.values }
                        });
                    }
                }
            }

            // Xóa sản phẩm
            const deletedProduct = await Product.findByIdAndDelete(productId);
            
            resolve({
                status: 'Ok',
                message: 'Xóa sản phẩm thành công',
                data: deletedProduct,
            });
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Không thể xóa sản phẩm',
                error: error.message,
            });
        }
    });
};

// Thêm biến thể sản phẩm
const addProductVariant = (productId, newVariantData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return resolve({
                    status: 'Error',
                    message: 'Không tìm thấy sản phẩm',
                });
            }

            const { name, values, details } = newVariantData;
            
            // Kiểm tra và lấy hoặc tạo Variant
            let variant = await Variant.findOne({ name });
            
            if (!variant) {
                // Tạo mới Variant nếu chưa tồn tại
                variant = await Variant.create({
                    name,
                    values
                });
            } else {
                // Cập nhật thêm giá trị mới vào Variant nếu cần
                let updatedValues = [...variant.values];
                
                for (const value of values) {
                    if (!updatedValues.includes(value)) {
                        updatedValues.push(value);
                    }
                }
                
                if (updatedValues.length > variant.values.length) {
                    variant.values = updatedValues;
                    await variant.save();
                }
            }

            // Cập nhật thuộc tính trong sản phẩm
            let attrIndex = -1;
            if (product.attributes) {
                attrIndex = product.attributes.findIndex(attr => attr.name === name);
            } else {
                product.attributes = [];
            }

            if (attrIndex >= 0) {
                // Cập nhật thuộc tính hiện có
                for (const value of values) {
                    if (!product.attributes[attrIndex].values.includes(value)) {
                        product.attributes[attrIndex].values.push(value);
                    }
                }
                // Đảm bảo variantId được cập nhật
                product.attributes[attrIndex].variantId = variant._id;
            } else {
                // Thêm thuộc tính mới
                product.attributes.push({
                    name,
                    values,
                    variantId: variant._id
                });
            }

            // Cập nhật trạng thái hasVariants
            product.hasVariants = true;
            await product.save();
            
            // Thêm chi tiết biến thể nếu có
            if (details && details.length > 0) {
                for (const detail of details) {
                    // Kiểm tra xem chi tiết biến thể đã tồn tại chưa
                    const existingDetail = await DetailsVariant.findOne({
                        variantId: variant._id,
                        value: detail.value
                    });

                    if (existingDetail) {
                        // Cập nhật chi tiết biến thể
                        existingDetail.price = detail.price;
                        existingDetail.compareAtPrice = detail.compareAtPrice;
                        existingDetail.inventory = detail.inventory;
                        await existingDetail.save();
                    } else {
                        // Tạo mới chi tiết biến thể
                        await DetailsVariant.create({
                            variantId: variant._id,
                            value: detail.value,
                            price: detail.price,
                            compareAtPrice: detail.compareAtPrice,
                            inventory: detail.inventory
                        });
                    }
                }
            }

            resolve({
                status: 'Ok',
                message: 'Thêm biến thể sản phẩm thành công',
                data: product,
            });
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Không thể thêm biến thể sản phẩm',
                error: error.message,
            });
        }
    });
};

// Lấy thông tin sản phẩm với chi tiết biến thể
const getProductWithVariants = (productId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return resolve({
                    status: 'Error',
                    message: 'Không tìm thấy sản phẩm',
                });
            }

            const productData = product.toObject();
            
            // Lấy chi tiết biến thể cho từng thuộc tính
            if (product.hasVariants && product.attributes && product.attributes.length > 0) {
                const variantDetails = [];
                
                for (const attr of product.attributes) {
                    if (attr.variantId) {
                        // Lấy Variant
                        const variant = await Variant.findById(attr.variantId);
                        
                        if (variant) {
                            // Lấy chi tiết biến thể
                            const detailsVariants = await DetailsVariant.find({
                                variantId: attr.variantId,
                                value: { $in: attr.values }
                            });
                            
                            variantDetails.push({
                                name: attr.name,
                                values: attr.values,
                                variantId: attr.variantId,
                                details: detailsVariants
                            });
                        }
                    }
                }
                
                productData.variantDetails = variantDetails;
            }

            resolve({
                status: 'Ok',
                data: productData,
            });
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Không thể lấy thông tin sản phẩm với biến thể',
                error: error.message,
            });
        }
    });
};

// Cập nhật chi tiết biến thể
const updateVariantDetail = (detailId, updatedData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const updatedDetail = await DetailsVariant.findByIdAndUpdate(
                detailId,
                updatedData,
                { new: true }
            );
            
            if (!updatedDetail) {
                return resolve({
                    status: 'Error',
                    message: 'Không tìm thấy chi tiết biến thể',
                });
            }
            
            resolve({
                status: 'Ok',
                message: 'Cập nhật chi tiết biến thể thành công',
                data: updatedDetail,
            });
        } catch (error) {
            console.error('Database Error:', error);
            reject({
                status: 'Error',
                message: 'Không thể cập nhật chi tiết biến thể',
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
    getProductWithVariants,
    updateVariantDetail
};