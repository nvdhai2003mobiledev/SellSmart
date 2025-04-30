import { types, Instance, flow, cast } from 'mobx-state-tree';
import { fetchProducts, fetchProductsfororder } from '../../services/api/productAPI';

// Variant Detail model
const VariantDetail = types.model({
  variantId: types.string,
  value: types.string,
});

// Details Variant model
const DetailsVariant = types.model({
  variantDetails: types.array(VariantDetail),
  price: types.number,
  inventory: types.number,
});

// Product model
export const Product = types.model({
  _id: types.identifier,
  name: types.string,
  thumbnail: types.maybeNull(types.string),
  category: types.union(
    types.string,
    types.model({
      _id: types.string,
      name: types.string,
    })
  ),
  providerId: types.union(
    types.string,
    types.model({
      _id: types.string,
      fullName: types.string,
    })
  ),
  status: types.enumeration(['available', 'unavailable']),
  hasVariants: types.boolean,
  price: types.maybeNull(types.number),
  inventory: types.maybeNull(types.number),
  inventoryId: types.string,
  product_code: types.maybeNull(types.string),
  detailsVariants: types.array(DetailsVariant),
  createdAt: types.maybeNull(types.string),
  updatedAt: types.maybeNull(types.string),
});

// Product Store
export const ProductStore = types
  .model({
    products: types.array(Product),
    isLoading: types.optional(types.boolean, false),
    error: types.optional(types.string, ''),
    totalPrice: types.optional(types.number, 0),
  })
  .views(self => ({
    get availableProducts() {
      return self.products.filter(product => product.status === 'available');
    },
    get unavailableProducts() {
      return self.products.filter(product => product.status === 'unavailable');
    },
    get productsWithVariants() {
      return self.products.filter(product => product.hasVariants);
    },
  }))
  .actions(self => {
    const calculateTotalPrice = () => {
      self.totalPrice = self.products.reduce((sum, product) => {
        if (product.price !== null) {
          return sum + product.price;
        }
        const variantSum = product.detailsVariants.reduce((variantSum, variant) => {
          return variantSum + variant.price;
        }, 0);
        return sum + variantSum;
      }, 0);
    };

    return {
      setProducts(products: Instance<typeof Product>[]) {
        self.products = cast(products);
      },
      setLoading(status: boolean) {
        self.isLoading = status;
      },
      setError(message: string) {
        self.error = message;
      },
      calculateTotalPrice,
      fetchProducts: flow(function* () {
        self.isLoading = true;
        self.error = '';

        try {
          console.log('Bắt đầu tải danh sách sản phẩm...');
          const productsData = yield fetchProducts();
          console.log('Dữ liệu trả về từ API:', productsData);

          if (Array.isArray(productsData)) {
            self.products = cast(productsData);
            calculateTotalPrice();
            console.log('Products loaded successfully, count:', productsData.length);
          } else {
            console.error('Invalid products data format:', productsData);
            self.error = 'Invalid data received from server';
          }
        } catch (error: unknown) {
          console.error('Exception in fetchProducts:', error);
          if (error instanceof Error) {
            self.error = error.message;
          } else {
            self.error = 'Không thể kết nối tới server, vui lòng kiểm tra kết nối mạng';
          }
        } finally {
          self.isLoading = false;
        }
      }),
      deleteProduct: flow(function* (id: string) {
        self.isLoading = true;
        try {
          self.products = cast(self.products.filter(product => product._id !== id));
          calculateTotalPrice();
          console.log(`Đã xóa sản phẩm với id: ${id}`);
        } catch (error: unknown) {
          console.error('Lỗi khi xóa sản phẩm:', error);
          self.error = error instanceof Error ? error.message : 'Không thể xóa sản phẩm';
        } finally {
          self.isLoading = false;
        }
      }),
    };
  });

export type ProductInstance = Instance<typeof Product>;
export type ProductStoreInstance = Instance<typeof ProductStore>;