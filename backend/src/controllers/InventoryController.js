const Inventory = require("../models/Inventory");
const TypeProduct = require("../models/TypeProduct");
const Provider = require("../models/Provider");
const mongoose = require("mongoose");

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
		if (!batchInfo.provider_id || !batchInfo.import_date) {
			console.error("Thông tin lô hàng không đầy đủ:", batchInfo);
			return res.status(400).json({
				status: 'Error',
				message: 'Thông tin lô hàng không đầy đủ'
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

		for (const product of products) {
			if (!product.typeProduct_id || !product.product_name) {
				console.warn("Bỏ qua sản phẩm thiếu thông tin:", product);
				continue;
			}

			// Tăng số thứ tự cho mỗi sản phẩm
			lastNumber++;
			const productCode = `MD${String(lastNumber).padStart(3, '0')}`;

			const baseProduct = {
				product_code: productCode,
				product_name: product.product_name,
				product_description: product.product_description || '',
				typeProduct_id: product.typeProduct_id,
				provider_id: batchInfo.provider_id,
				batch_number: batchInfo.batch_number,
				batch_date: batchInfo.import_date,
				unit: product.unit || 'cái',
				note: product.note || '',
				type: 'import',
				hasVariants: product.hasVariants || false,
				batch_info: [{
					batch_number: batchInfo.batch_number,
					batch_date: batchInfo.import_date,
					quantity: product.quantity,
					price: product.price,
					note: product.note || ''
				}]
			};

			if (product.hasVariants && Array.isArray(product.variants)) {
				console.log("Xử lý sản phẩm có biến thể:", {
					product_name: product.product_name,
					variants: product.variants
				});

				const variantDetails = product.variants.map(variant => ({
					attributes: new Map(Object.entries(variant.variants.reduce((acc, v) => {
						acc[v.name] = v.value;
						return acc;
					}, {}))),
					price: variant.price,
					quantity: variant.quantity
				}));

				baseProduct.variantDetails = variantDetails;
				baseProduct.total_quantity = product.quantity;
				baseProduct.total_price = product.price * product.quantity;
			} else {
				baseProduct.variantDetails = [];
				baseProduct.total_quantity = product.quantity;
				baseProduct.total_price = product.price * product.quantity;
			}

			inventoryItems.push(baseProduct);
		}

		if (inventoryItems.length === 0) {
			return res.status(400).json({
				status: 'Error',
				message: 'Không có sản phẩm hợp lệ để nhập kho'
			});
		}

		const savedItems = await Inventory.insertMany(inventoryItems);

		console.log(`Đã lưu ${savedItems.length} sản phẩm vào kho`);
		res.status(200).json({
			status: 'Success',
			message: 'Nhập kho thành công',
			data: savedItems
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

module.exports = {
	importInventory,
	updateInventory,
	getInventoryList,
	getInventoryDetail,
	getInventoryByBatch,
	deleteInventory,
	getLastProductCode,
	getProductsForBatch,
};