import { types, Instance, flow, cast } from 'mobx-state-tree';
import { fetchProducts } from '../../services/api/productAPI';

// Variant Detail model
const VariantDetail = types.model({
  variantId: types.string,
  value: types.string,
});

// Product Variant model
const ProductVariant = types.model({
  variantDetails: types.array(VariantDetail),
  price: types.number,
  inventory: types.number,
});

// Details Variant model
const DetailsVariant = types.model({
  _id: types.identifier,
  productId: types.string,
  variantDetails: types.array(VariantDetail),
  price: types.number,
  inventory: types.number,
  compareAtPrice: types.maybeNull(types.number),
  createdAt: types.maybe(types.string),
  updatedAt: types.maybe(types.string),
});

// Product model
export const Product = types.model({
  _id: types.identifier,
  name: types.string,
  thumbnail: types.maybeNull(types.string),
  category: types.string,
  providerId: types.string,
  status: types.enumeration(['available', 'unavailable']),
  hasVariants: types.optional(types.boolean, false),
  price: types.maybeNull(types.number),
  inventory: types.maybeNull(types.number),
  variants: types.array(ProductVariant),
  detailsVariants: types.array(DetailsVariant),
  createdAt: types.maybe(types.string),
  updatedAt: types.maybe(types.string),
});

// Product Store
export const ProductStore = types
  .model({
    products: types.array(Product),
    isLoading: types.optional(types.boolean, false),
    error: types.optional(types.string, ''),
    totalPrice: types.optional(types.number, 0), // Đã thêm totalPrice
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
  .actions(self => ({
    setProducts(products: Instance<typeof Product>[]) {
      self.products = cast(products);
    },
    setLoading(status: boolean) {
      self.isLoading = status;
    },
    setError(message: string) {
      self.error = message;
    },
    fetchProducts: flow(function* () {
      self.isLoading = true;
      self.error = '';

      try {
        const productsData: unknown = yield fetchProducts();

        console.log('Received products data:', productsData);

        if (Array.isArray(productsData)) {
          const processedProducts = productsData.map(product => {
            if (!product.variants) product.variants = [];
            if (!product.detailsVariants) product.detailsVariants = [];
            return product;
          });
          self.products = cast(processedProducts);
          self.calculateTotalPrice(); // Gọi đúng trong actions
          console.log('Products loaded successfully, count:', processedProducts.length);
        } else if (productsData && typeof productsData === 'object' && 'data' in productsData) {
          const products = (productsData as { data: unknown }).data;
          if (Array.isArray(products)) {
            self.products = cast(products);
            self.calculateTotalPrice(); // Gọi đúng trong actions
            console.log('Products extracted from object, count:', products.length);
          } else {
            console.error('Unexpected products data format:', productsData);
            self.error = 'Unexpected data format received from server';
          }
        } else {
          console.error('Invalid products data:', productsData);
          self.error = 'Invalid data received from server';
        }
      } catch (error: unknown) {
        console.error('Exception in fetchProducts:', error);
        self.error = error instanceof Error ? error.message : 'An unexpected error occurred';
      } finally {
        self.isLoading = false;
      }
    }),
    calculateTotalPrice() { // Đảm bảo nằm trong actions
      self.totalPrice = self.products.reduce((sum, product) => {
        if (product.price !== null) {
          return sum + product.price;
        }
        const variantSum = product.variants.reduce((variantSum, variant) => {
          return variantSum + variant.price;
        }, 0);
        return sum + variantSum;
      }, 0);
    },
    deleteProduct: flow(function* (id: string) { // Đảm bảo nằm trong actions
      self.isLoading = true;
      try {
        self.products = cast(self.products.filter(product => product._id !== id));
        self.calculateTotalPrice(); // Gọi đúng trong actions
        console.log(`Đã xóa sản phẩm với id: ${id}`);
      } catch (error: unknown) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        self.error = error instanceof Error ? error.message : 'Không thể xóa sản phẩm';
      } finally {
        self.isLoading = false;
      }
    }),
  }));

export type ProductInstance = Instance<typeof Product>;
export type ProductStoreInstance = Instance<typeof ProductStore>;