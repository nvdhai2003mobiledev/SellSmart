import { types, Instance } from 'mobx-state-tree';
import { ProductStore } from './product'; // Import ProductStore đã định nghĩa
import { fetchProducts } from '../../services/api/productAPI';

// Định nghĩa RootStore chỉ chứa ProductStore
export const RootStore = types.model({
  productStore: types.optional(ProductStore, {
    products: [],
    isLoading: false,
    totalPrice: 0,
    error: '', // Thay null bằng chuỗi rỗng để khớp với types.optional(types.string, '')
  }),
});

// Định nghĩa kiểu cho RootStoreInstance
export type RootStoreInstance = Instance<typeof RootStore>;

// Tạo một instance singleton cho store
let store: RootStoreInstance | null = null;

// Hàm khởi tạo store
export function khoiTaoStore() {
  if (store === null) {
    store = RootStore.create({
      productStore: {
        products: [],
        isLoading: false,
        totalPrice: 0,
        error: '', // Thay null bằng chuỗi rỗng để khớp với types.optional(types.string, '')
      },
    });
    console.log('=== RootStore đã được khởi tạo với ProductStore ===');
  }
  return store;
}

// Hàm lấy store
export function layStore() {
  if (store === null) {
    return khoiTaoStore();
  }
  return store;
}

// Hàm tải lại danh sách sản phẩm
export async function taiLaiSanPham() {
  try {
    const currentStore = layStore();
    if (!currentStore.productStore.isLoading) {
      await currentStore.productStore.fetchProducts();
      console.log('Đã tải lại danh sách sản phẩm');
    }
  } catch (error) {
    console.error('Lỗi khi tải lại danh sách sản phẩm:', error);
  }
}

// Hàm xóa store
export function xoaStore() {
  store = null;
  console.log('=== Store đã được xóa ===');
}