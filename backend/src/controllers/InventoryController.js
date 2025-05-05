const Inventory = require("../models/Inventory");
const TypeProduct = require("../models/TypeProduct");
const Provider = require("../models/Provider");
const mongoose = require("mongoose");

// Hàm tiện ích để gửi thông báo
async function sendBatchNotification(batchNumber, type, firstItem) {
    try {
        const notificationController = require('./NotificationController');
        
        // Tạo tiêu đề thông báo
        const notificationTitle = type === 'NEW_BATCH' 
            ? `Lô hàng mới: ${batchNumber}`
            : `Cập nhật lô hàng: ${batchNumber}`;
        
        // Lấy thông tin danh mục và nhà cung cấp
        const category = await TypeProduct.findById(firstItem.typeProduct_id);
        const provider = await Provider.findById(firstItem.provider_id);
        
        const categoryName = category?.name || 'Không xác định';
        const providerName = provider?.fullName || 'Không xác định';
        const totalQuantity = firstItem.total_quantity || 0;
        const totalPrice = firstItem.total_price ? firstItem.total_price.toLocaleString('vi-VN') : '0';
        
        // Tạo nội dung thông báo
        const notificationBody = `${categoryName} - ${providerName} - ${totalQuantity} sản phẩm - ${totalPrice} đ`;
        
        // Dữ liệu bổ sung cho thông báo
        const notificationData = {
            screen: 'InventoryDetail',
            batchNumber: batchNumber,
            type: type,
            timestamp: Date.now().toString()
        };
        
        console.log(`Gửi thông báo (${type}):`, {
            title: notificationTitle,
            body: notificationBody,
            data: notificationData
        });
        
        // Gửi thông báo đến tất cả thiết bị
        const notificationResult = await notificationController.sendNotificationToAll(
            notificationTitle,
            notificationBody,
            notificationData
        );
        
        console.log('Kết quả gửi thông báo:', notificationResult);
    } catch (notificationError) {
        console.error('Lỗi khi gửi thông báo:', notificationError);
        // Tiếp tục xử lý ngay cả khi gửi thông báo thất bại
    }
}

// Nhập kho sản phẩm mới
const importInventory = async (req, res) => {
    try {
        console.log("=== Bắt đầu xử lý nhập kho ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        
        const { batchInfo, products } = req.body;
        
        if (!batchInfo || !products || !Array.isArray(products) || products.length === 0) {
            console.error("Dữ liệu nhập kho không hợp lệ:", { batchInfo, products });
            return res.status(400).json({
                status: 'Error',
                message: 'Dữ liệu nhập kho không hợp lệ'
            });
        }

        // Validate batch info
        if (!batchInfo.batch_number || !batchInfo.import_date) {
            console.error("Thông tin lô hàng không đầy đủ:", batchInfo);
            return res.status(400).json({
                status: 'Error',
                message: 'Thông tin lô hàng không đầy đủ: cần có số lô hàng và ngày nhập'
            });
        }

        // Lấy mã sản phẩm cuối cùng
        const lastInventory = await Inventory.findOne({}, { product_code: 1 })
            .sort({ product_code: -1 })
            .collation({ locale: "en_US", numericOrdering: true });

        let lastNumber = 0;
        if (lastInventory) {
            const match = lastInventory.product_code.match(/^MD(\d+)$/);
            if (match) {
                lastNumber = parseInt(match[1]);
            }
        }

        // Tạo mảng chứa các sản phẩm sẽ được lưu
        const inventoryItems = [];
        const updatedItems = [];

        for (const product of products) {
            if (!product.typeProduct_id || !product.product_name || !product.provider_id) {
                console.warn("Bỏ qua sản phẩm thiếu thông tin:", product);
                continue;
            }

            // Kiểm tra xem sản phẩm đã tồn tại chưa (dựa trên tên và danh mục)
            const existingProduct = await Inventory.findOne({
                product_name: product.product_name,
                typeProduct_id: product.typeProduct_id
            });

            if (existingProduct) {
                console.log(`Sản phẩm "${product.product_name}" đã tồn tại, cập nhật thông tin...`);
                
                // Cập nhật thông tin cho sản phẩm hiện có
                if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
                    // Xử lý biến thể
                    const newVariants = product.variants.map(variant => ({
                        attributes: new Map(Object.entries(
                            typeof variant.attributes === 'string' 
                                ? variant.attributes.split(', ').reduce((acc, pair) => {
                                    const [key, value] = pair.split(': ');
                                    acc[key] = value;
                                    return acc;
                                }, {})
                                : variant.attributes
                        )),
                        price: Number(variant.price) || 0,
                        quantity: Number(variant.quantity) || 0
                    }));
                    
                    // Trường hợp có biến thể mới hoặc cập nhật biến thể cũ
                    if (existingProduct.hasVariants) {
                        // Tìm và cập nhật từng biến thể
                        for (const newVariant of newVariants) {
                            // Tìm biến thể tương ứng trong sản phẩm hiện có
                            const existingVariantIndex = existingProduct.variantDetails.findIndex(v => {
                                // So sánh các thuộc tính của biến thể
                                const existingAttrs = Object.fromEntries(v.attributes);
                                const newAttrs = Object.fromEntries(newVariant.attributes);
                                return Object.keys(existingAttrs).length === Object.keys(newAttrs).length &&
                                    Object.keys(existingAttrs).every(key => existingAttrs[key] === newAttrs[key]);
                            });
                            
                            if (existingVariantIndex >= 0) {
                                // Cập nhật biến thể hiện có
                                const existingVariant = existingProduct.variantDetails[existingVariantIndex];
                                
                                // Tính giá trung bình có trọng số
                                const oldTotalValue = existingVariant.price * existingVariant.quantity;
                                const newTotalValue = newVariant.price * newVariant.quantity;
                                const totalQuantity = existingVariant.quantity + newVariant.quantity;
                                
                                existingVariant.quantity = totalQuantity;
                                existingVariant.price = (oldTotalValue + newTotalValue) / totalQuantity; // Giá trung bình
                            } else {
                                // Thêm biến thể mới
                                existingProduct.variantDetails.push(newVariant);
                            }
                        }
                    } else {
                        // Chuyển đổi từ không biến thể sang có biến thể
                        existingProduct.hasVariants = true;
                        existingProduct.variantDetails = newVariants;
                    }
                    
                    // Cập nhật tổng số lượng và giá trung bình
                    existingProduct.total_quantity = existingProduct.variantDetails.reduce((sum, v) => sum + v.quantity, 0);
                    const totalValue = existingProduct.variantDetails.reduce((sum, v) => sum + (v.price * v.quantity), 0);
                    existingProduct.total_price = existingProduct.total_quantity > 0 ? totalValue / existingProduct.total_quantity : 0;
                } else {
                    // Xử lý sản phẩm không có biến thể
                    // Tính giá trung bình có trọng số
                    const oldTotalValue = existingProduct.total_price * existingProduct.total_quantity;
                    const newTotalValue = product.price * product.quantity;
                    const totalQuantity = existingProduct.total_quantity + product.quantity;
                    
                    existingProduct.total_quantity = totalQuantity;
                    existingProduct.total_price = totalQuantity > 0 ? (oldTotalValue + newTotalValue) / totalQuantity : product.price;
                    existingProduct.variantDetails = [];
                }
                
                // Thêm thông tin lô hàng mới
                // Tính giá trung bình hoặc lấy giá hợp lệ cho batch info
                let batchPrice = 0;
                if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
                    // Tính giá trung bình của các biến thể
                    const totalQuantity = product.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
                    const totalValue = product.variants.reduce((sum, v) => sum + ((Number(v.price) || 0) * (Number(v.quantity) || 0)), 0);
                    
                    if (totalQuantity > 0 && totalValue > 0) {
                        batchPrice = totalValue / totalQuantity;
                    } else {
                        // Nếu không có số lượng hoặc giá trị, tìm giá khác 0 đầu tiên
                        const firstNonZeroPrice = product.variants.find(v => Number(v.price) > 0)?.price;
                        batchPrice = Number(firstNonZeroPrice) || 0;
                    }
                } else {
                    // Đối với sản phẩm không có biến thể
                    batchPrice = Number(product.price) || 0;
                }
                
                // Lưu thông tin batch với giá đã tính toán
                existingProduct.batch_info.push({
                    batch_number: batchInfo.batch_number,
                    batch_date: batchInfo.import_date,
                    quantity: product.hasVariants 
                        ? product.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0) 
                        : Number(product.quantity) || 0,
                    price: batchPrice,
                    note: batchInfo.note || ''
                });
                console.log(`Giá batch mới được tính: ${batchPrice}`);
                
                // Cập nhật trạng thái
                existingProduct.status = existingProduct.total_quantity > 0 ? 'available' : 'unavailable';
                
                // Lưu thay đổi
                await existingProduct.save();
                updatedItems.push(existingProduct);
            } else {
                // Tăng số thứ tự cho mỗi sản phẩm mới
                lastNumber++;
                const productCode = `MD${String(lastNumber).padStart(3, '0')}`;

                const baseProduct = {
                    product_code: productCode,
                    product_name: product.product_name,
                    product_description: product.product_description || '',
                    typeProduct_id: product.typeProduct_id,
                    provider_id: product.provider_id,
                    batch_number: batchInfo.batch_number,
                    batch_date: batchInfo.import_date,
                    unit: product.unit || 'cái',
                    note: product.note || '',
                    type: 'import',
                    hasVariants: product.hasVariants || false,
                    batch_info: [{
                        batch_number: batchInfo.batch_number,
                        batch_date: batchInfo.import_date,
                        quantity: product.hasVariants 
                            ? product.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0) 
                            : Number(product.quantity) || 0,
                        price: product.hasVariants 
                            ? (product.variantDetails && product.variantDetails.length > 0 
                                ? product.variantDetails.reduce((sum, v) => sum + ((v.price || 0) * (v.quantity || 0)), 0) / 
                                  (product.variantDetails.reduce((sum, v) => sum + (v.quantity || 0), 0) || 1)
                                : (product.variants && product.variants.length > 0 
                                    ? product.variants.reduce((sum, v) => sum + ((Number(v.price) || 0) * (Number(v.quantity) || 0)), 0) / 
                                      (product.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0) || 1)
                                    : 0))
                            : Number(product.price) || 0,
                        note: product.note || ''
                    }]
                };

                if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
                    console.log("Xử lý sản phẩm có biến thể:", {
                        product_name: product.product_name,
                        variants: product.variants
                    });

                    // Xử lý biến thể
                    console.log("Variant data before processing:", JSON.stringify(product.variants, null, 2));
                    
                    const variantDetails = product.variants.map(variant => {
                        // Ensure price is properly processed - parse as float and validate
                        let price = 0;
                        if (variant.price !== undefined && variant.price !== null && variant.price !== '') {
                            price = parseFloat(variant.price);
                            if (isNaN(price)) {
                                console.warn(`Invalid price format for variant: ${JSON.stringify(variant)}`);
                                price = 0;
                            }
                        }
                        
                        // Similarly ensure quantity is properly processed
                        let quantity = 0;
                        if (variant.quantity !== undefined && variant.quantity !== null && variant.quantity !== '') {
                            quantity = parseInt(variant.quantity, 10);
                            if (isNaN(quantity)) {
                                console.warn(`Invalid quantity format for variant: ${JSON.stringify(variant)}`);
                                quantity = 0;
                            }
                        }
                        
                        console.log(`Processed variant: price=${price}, quantity=${quantity}`);
                        
                        return {
                            attributes: new Map(Object.entries(
                                typeof variant.attributes === 'string' 
                                    ? variant.attributes.split(', ').reduce((acc, pair) => {
                                        const [key, value] = pair.split(': ');
                                        acc[key] = value;
                                        return acc;
                                    }, {})
                                    : variant.attributes
                            )),
                            price: price,
                            quantity: quantity
                        };
                    });

                    baseProduct.variantDetails = variantDetails;
                    
                    // Tính tổng số lượng và giá trung bình có trọng số
                    baseProduct.total_quantity = variantDetails.reduce((sum, v) => sum + v.quantity, 0);
                    const totalValue = variantDetails.reduce((sum, v) => sum + (v.price * v.quantity), 0);
                    
                    // Ensure we have valid data for average price calculation
                    if (baseProduct.total_quantity > 0 && totalValue > 0) {
                        baseProduct.total_price = totalValue / baseProduct.total_quantity;
                        console.log(`Average price calculated: ${baseProduct.total_price} = ${totalValue} / ${baseProduct.total_quantity}`);
                    } else if (variantDetails.length > 0) {
                        // If we have variants but no valid quantity/price, use the first non-zero price as fallback
                        const firstNonZeroPrice = variantDetails.find(v => v.price > 0)?.price;
                        baseProduct.total_price = firstNonZeroPrice || 0;
                        console.log(`Using first non-zero price as fallback: ${baseProduct.total_price}`);
                    } else {
                        baseProduct.total_price = 0;
                        console.log('No valid price data, setting price to 0');
                    }

                } else {
                    // For non-variant products, ensure proper handling of price and quantity
                    baseProduct.variantDetails = [];
                    
                    // Process quantity with validation
                    let quantity = 0;
                    if (product.quantity !== undefined && product.quantity !== null && product.quantity !== '') {
                        quantity = parseInt(product.quantity, 10);
                        if (isNaN(quantity)) {
                            console.warn(`Invalid quantity format for product: ${JSON.stringify(product)}`);
                            quantity = 0;
                        }
                    }
                    baseProduct.total_quantity = quantity;
                    
                    // Process price with validation
                    let price = 0;
                    if (product.price !== undefined && product.price !== null && product.price !== '') {
                        price = parseFloat(product.price);
                        if (isNaN(price)) {
                            console.warn(`Invalid price format for product: ${JSON.stringify(product)}`);
                            price = 0;
                        }
                    }
                    baseProduct.total_price = price;
                    
                    console.log(`Non-variant product processed: quantity=${quantity}, price=${price}`);
                }

                // Đảm bảo trạng thái dựa trên số lượng
                baseProduct.status = baseProduct.total_quantity > 0 ? 'available' : 'unavailable';

                inventoryItems.push(baseProduct);
            }
        }

        // Tạo các bản ghi mới
        let savedItems = [];
        if (inventoryItems.length > 0) {
            // Cập nhật lại giá trung bình cho mỗi sản phẩm trước khi lưu
            inventoryItems.forEach(item => {
                // Nếu sản phẩm có nhiều lô hàng (hiện mục này luôn chỉ có 1 lô khi tạo mới)
                if (item.batch_info && item.batch_info.length > 0) {
                    // Đảm bảo giá batch info trùng khớp với total_price ban đầu
                    item.batch_info[0].price = Number(item.batch_info[0].price) || 0;
                }
            });
            
            // Log the calculated prices before saving
            console.log('Items to be saved:', inventoryItems.map(item => ({
                name: item.product_name,
                total_price: item.total_price,
                batch_price: item.batch_info[0]?.price || 0
            })));
            savedItems = await Inventory.insertMany(inventoryItems);
        }

        // Gửi thông báo khi thêm lô hàng mới thành công
        if (savedItems.length > 0) {
            await sendBatchNotification(batchInfo.batch_number, 'NEW_BATCH', savedItems[0]);
        }

        // Gửi thông báo khi cập nhật lô hàng tiếp theo thành công
        if (updatedItems.length > 0) {
            await sendBatchNotification(batchInfo.batch_number, 'UPDATED_BATCH', updatedItems[0]);
        }

        console.log(`Đã lưu ${savedItems.length} sản phẩm mới, cập nhật ${updatedItems.length} sản phẩm hiện có`);
        res.status(200).json({
            status: 'Success',
            message: 'Nhập kho thành công',
            data: {
                newItems: savedItems,
                updatedItems: updatedItems
            }
        });

    } catch (error) {
        console.error('Error importing inventory:', error);
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi nhập kho: ' + error.message
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

        // Lưu sản phẩm đã cập nhật
        await inventory.save();
        console.log("Đã cập nhật sản phẩm:", id);

        // Gửi thông báo khi cập nhật lô hàng thành công
        try {
            const notificationController = require('./NotificationController');
            
            // Tạo tiêu đề và nội dung thông báo
            const notificationTitle = `Cập nhật lô hàng: ${batch_number}`;
            
            // Lấy thông tin danh mục và nhà cung cấp
            const category = await TypeProduct.findById(typeProduct_id);
            const provider = await Provider.findById(provider_id);
            
            const categoryName = category?.name || 'Không xác định';
            const providerName = provider?.fullName || 'Không xác định';
            const totalQuantityDisplay = totalQuantity || 0;
            const totalPriceDisplay = (totalPrice / totalQuantity || 0).toLocaleString('vi-VN');
            
            // Tạo nội dung thông báo
            const notificationBody = `${categoryName} - ${providerName} - ${totalQuantityDisplay} sản phẩm - ${totalPriceDisplay} đ`;
            
            // Dữ liệu bổ sung cho thông báo (dùng cho điều hướng)
            const notificationData = {
                screen: 'InventoryDetail',
                batchNumber: batch_number,
                type: 'UPDATED_BATCH',
                timestamp: Date.now().toString()
            };
            
            console.log('Gửi thông báo về cập nhật lô hàng:', {
                title: notificationTitle,
                body: notificationBody,
                data: notificationData
            });
            
            // Gửi thông báo đến tất cả thiết bị
            const notificationResult = await notificationController.sendNotificationToAll(
                notificationTitle,
                notificationBody,
                notificationData
            );
            
            console.log('Kết quả gửi thông báo:', notificationResult);
        } catch (notificationError) {
            console.error('Lỗi khi gửi thông báo:', notificationError);
            // Tiếp tục xử lý ngay cả khi gửi thông báo thất bại
        }

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

        const inventory = await Inventory.findById(id)
            .populate({ path: "typeProduct_id", select: "name variants" })
            .populate({ path: "provider_id", select: "fullName" })
            .lean();

        if (!inventory) {
            console.log("Không tìm thấy sản phẩm với ID:", id);
            return res.status(404).json({
                status: "Error",
                message: "Sản phẩm không tồn tại trong kho",
            });
        }

        // Tính lại giá trung bình từ tất cả các lô hàng
        if (inventory.batch_info && inventory.batch_info.length > 0) {
            console.log('Recalculating weighted average price from all batch entries...');
            
            // Tính tổng số lượng và tổng giá trị từ tất cả các lô
            let totalBatchQuantity = 0;
            let totalBatchValue = 0;
            
            console.log('Batch info:', JSON.stringify(inventory.batch_info, null, 2));
            
            // Xử lý từng lô hàng
            inventory.batch_info.forEach(batch => {
                const batchQuantity = Number(batch.quantity) || 0;
                const batchPrice = Number(batch.price) || 0;
                
                // Tính tổng số lượng và tổng giá trị
                totalBatchQuantity += batchQuantity;
                totalBatchValue += batchQuantity * batchPrice;
                
                console.log(`Batch: ${batch.batch_number}, Quantity: ${batchQuantity}, Price: ${batchPrice}, Value: ${batchQuantity * batchPrice}`);
            });
            
            // Tính giá trung bình có trọng số
            if (totalBatchQuantity > 0) {
                const weightedAveragePrice = totalBatchValue / totalBatchQuantity;
                console.log(`Weighted average price: ${weightedAveragePrice} = ${totalBatchValue} / ${totalBatchQuantity}`);
                
                // Cập nhật giá trung bình trong kết quả trả về
                inventory.total_price = weightedAveragePrice;
            } else {
                console.log('No valid batch quantities found. Keeping original price.');
            }
        }
        
        // Chuyển đổi variantDetails nếu có
        if (inventory.variantDetails) {
            // Lấy thông tin về các biến thể từ typeProduct
            const variantMap = new Map();
            if (inventory.typeProduct_id && inventory.typeProduct_id.variants) {
                for (const variantId of inventory.typeProduct_id.variants) {
                    const variant = await mongoose.model('Variant').findById(variantId).lean();
                    if (variant) {
                        variantMap.set(variant._id.toString(), variant);
                    }
                }
            }

            inventory.variantDetails = inventory.variantDetails.map(variant => {
                let attrs = {};
                if (variant.attributes) {
                    if (variant.attributes instanceof Map) {
                        for (const [key, value] of variant.attributes.entries()) {
                            // Lấy tên biến thể từ variantMap
                            const variantInfo = variantMap.get(key);
                            if (variantInfo) {
                                attrs[variantInfo.name] = value;
                            } else {
                                attrs[key] = value;
                            }
                        }
                    } else if (typeof variant.attributes === 'object') {
                        for (const [key, value] of Object.entries(variant.attributes)) {
                            // Lấy tên biến thể từ variantMap
                            const variantInfo = variantMap.get(key);
                            if (variantInfo) {
                                attrs[variantInfo.name] = value;
                            } else {
                                attrs[key] = value;
                            }
                        }
                    }
                }
                return {
                    ...variant,
                    attributes: attrs
                };
            });
        }

        console.log("variantDetails sau khi xử lý:", JSON.stringify(inventory.variantDetails, null, 2));
        
        res.status(200).json({
            status: "Ok",
            inventory
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
            .populate({ path: "typeProduct_id", select: "name variants" })
            .populate({ path: "provider_id", select: "fullName" })
            .sort({ createdAt: -1 })
            .lean();
            
        console.log(`Tìm thấy ${inventories.length} sản phẩm thuộc lô hàng ${batch_number}`);
        
        if (inventories.length === 0) {
            return res.status(404).json({
                status: "Error",
                message: `Không tìm thấy lô hàng ${batch_number}`,
            });
        }
        
        // Lấy thông tin batch từ sản phẩm đầu tiên
        const firstProduct = inventories[0];
        const batchInfo = {
            batch_number: batch_number,
            import_date: firstProduct.batch_date,
            note: firstProduct.note || ''
        };
        
        // Chuyển đổi danh sách sản phẩm thành định dạng phù hợp cho frontend
        const products = inventories.map(item => {
            const product = {
                product_id: item._id,
                quantity: item.total_quantity,
                price: item.total_price,
            };
            
            // Nếu sản phẩm có biến thể, thêm thông tin biến thể
            if (item.hasVariants && item.variantDetails && item.variantDetails.length > 0) {
                product.variantData = {
                    index: 0, // Sẽ cần chọn lại trên frontend
                    attributes: item.variantDetails[0].attributes
                };
            }
            
            return product;
        });
        
        res.status(200).json({
            status: "Ok",
            batch: {
                ...batchInfo,
                products: products
            }
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

module.exports = {
    importInventory,
    updateInventory,
    getInventoryList,
    getInventoryDetail,
    getInventoryByBatch,
    deleteInventory,
    getLastProductCode,
    getProductsForBatch,
    sendBatchNotification,
};