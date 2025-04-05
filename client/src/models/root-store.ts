import { types, Instance, SnapshotIn, SnapshotOut } from 'mobx-state-tree';
import { AuthStore, authStore } from './auth/auth-store';
import { OnboardingStore } from './onboarding/onboarding-store';
import { EmployeeStoreModel, employeeStore } from './employee/employee-store';
import { CustomerStoreModel, customerStore } from './customer/customer-store';
import { OrderStore } from './Order/Order';
import { ProductStore } from './product/product';
import { PromotionStoreModel } from './promotion/promotion-store';


const RootStoreModel = types
  .model('RootStore', {
    auth: types.late(() => AuthStore),
    onboarding: types.late(() => OnboardingStore),
    employees: types.late(() => EmployeeStoreModel),
    customers: types.late(() => CustomerStoreModel), // Thêm customers
    orders: types.late(() => OrderStore),
    productStore: types.late(() => ProductStore),
    promotionStore: types.late(() => PromotionStoreModel),
  })
  .actions((self) => ({
    reset() {
      self.auth.clearAuth();
      self.onboarding.setHasSeenOnboarding(false);
      self.employees.reset();
      self.customers.reset();
      self.orders.reset();
      self.promotionStore.reset();
      // Reset product store if needed

    },
  }))
  .views((self) => ({
    get isAuthenticated() {
      return self.auth.isAuthenticated;
    },
    get isAdmin() {
      return self.auth.isAdmin;
    },
    get isEmployee() {
      return self.auth.isEmployee;
    },
    get userRole() {
      return self.auth.userRole;
    },
    get userFullName() {
      return self.auth.userFullName;
    },
    get hasSeenOnboarding() {
      return self.onboarding.hasSeenOnboarding;
    },
    get customerCount() {
      return self.customers.customerCount;
    },
    get providerCount() {
      return self.providers.providerCount;
    },
  }));

export interface IRootStore extends Instance<typeof RootStoreModel> {}
export interface IRootStoreSnapshotIn extends SnapshotIn<typeof RootStoreModel> {}
export interface IRootStoreSnapshotOut extends SnapshotOut<typeof RootStoreModel> {}

// Khởi tạo root store với giá trị mặc định
export const rootStore = RootStoreModel.create({
  auth: {
    accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImI2NmQ4NmUzMjU2NWJmN2YzYzdmNzFhZGQ2MWI2ZjEyZTg2NmYwMmU2YWIyY2ZiZDVmMjMzZDRiNGRkMTBiZDlkODljMzIzYTg4ODdjODAzIn0.eyJhdWQiOiIyIiwianRpIjoiYjY2ZDg2ZTMyNTY1YmY3ZjNjN2Y3MWFkZDYxYjZmMTJlODY2ZjAyZTZhYjJjZmJkNWYyMzNkNGI0ZGQxMGJkOWQ4OWMzMjNhODg4N2M4MDMiLCJpYXQiOjE3NDIzMDYyODUsIm5iZiI6MTc0MjMwNjI4NSwiZXhwIjoxNzQyMzA5ODg1LCJzdWIiOiJENUIwMzI1MC03MEZDLTExRUYtOUE5My0xMzhBMEIyMDlBOTYiLCJzY29wZXMiOltdfQ.cPGT2IStTG8n3Jp37w9ocBn7i34VdFeMpunyGdZ9L75FfYjYTBnBuLO9qAhDoeiArda_s90p9AA__O2VY-bh--d0mnzb5NYvF3fSuJdsJlXUudmEhDUGT1sBlpLJY59BUuTtCARhCqP5e5xMPg07c2H4GoO1fWIKu5gEDSYj0BQuTuCnecNm90DlfrcXLteUWOIzZ1Tt-sGFqsTSK91qzbg8YxrHddEAXGmRi6oUwAwrGU-KlcY7nmPc7cLrCm7u62ID5TeyZljSD3dDXopKYceKV3Rtb0Gb9XLsCAccc4deCU7qSfadJcAk5kZ0Ee0xmjB2r1BFhE-KJMQL0DfedQNRj0VQYXAnz4TPg5tINHysR-_rIB2ZUlvEB86XH-ICabJ2shoE_pLz1nD2xqjNbeTAUnJh0jHmHA0wPmlFk44R7DmbwZYKXR8X-7bAstFwLgWXhfAs00Gt-5pcx7FbIqcFF8q3rlfTi6iWTOmeC57m5LOrm0SMt0uq0ehkMi539hzWdeKdrQu3HivC1_dravPrLGN317TP0KJX51jlpgFej3P2ZwjESGeIPKwiaWr_LF8pPzN5_WIu2VratHGR8ojgE-OYI6lLMa2n8-a50PqX5xgSJmXa_30olt9iAXg3paOEtxCAGsSm0DVPygx-GJZcXsiV5bzj_ldOYBweh18"
  }),
  onboarding: OnboardingStore.create({}),
  employees: employeeStore,

  customers: customerStore,
  orders: OrderStore.create({ orders: [], isLoading: false, error: '' }),
  productStore: ProductStore.create({ products: [], isLoading: false, error: '', totalPrice: 0 }),
  promotionStore: PromotionStoreModel.create({ promotions: [], isLoading: false, error: '' }),
});


