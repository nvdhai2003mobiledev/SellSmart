import { types, Instance } from 'mobx-state-tree';
import { ProductStore } from './product'; // Import ProductStore đã định nghĩa

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
    console.log('=== RootStore đã được khởi tạo với ProductStore ===', JSON.stringify(store, null, 2));
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