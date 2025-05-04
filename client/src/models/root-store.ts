import { types, Instance, SnapshotIn, SnapshotOut, flow } from 'mobx-state-tree';
import { AuthStore, authStore } from './auth/auth-store';
import { OnboardingStore } from './onboarding/onboarding-store';
import { EmployeeStoreModel, employeeStore } from './employee/employee-store';
import { CustomerStoreModel, customerStore } from './customer/customer-store';
import { OrderStore } from './Order/Order';
import { ProductStore } from './product/product';
import { PromotionStoreModel } from './promotion/promotion-store';
import { ProviderStoreModel } from './provider/provider-store';
import { WarrantyStoreModel } from './Warranty/warranty-store';


const RootStoreModel = types
  .model('RootStore', {
    auth: types.late(() => AuthStore),
    onboarding: types.late(() => OnboardingStore),
    employees: types.late(() => EmployeeStoreModel),
    customers: types.late(() => CustomerStoreModel), // Thêm customers
    orders: types.late(() => OrderStore),
    productStore: types.late(() => ProductStore),
    promotionStore: types.late(() => PromotionStoreModel),
    providers: types.late(() => ProviderStoreModel),
    warranty: types.late(() => WarrantyStoreModel),

  })
  .actions((self) => ({
    reset: flow(function* () {
      yield self.auth.clearAuth();
      self.onboarding.setHasSeenOnboarding(false);
      self.employees.reset();
      self.customers.reset();
      self.orders.reset();
      self.promotionStore.reset();
      if (self.providers && self.providers.reset) {
        self.providers.reset();
      }
      if (self.productStore && self.productStore.reset) {
        self.productStore.reset();
      }
    }),
    
    logout: flow(function* () {
      try {
        // Use API to logout on server
        const Api = require('../services/api/api').Api;
        const ApiEndpoint = require('../services/api/api-endpoint').ApiEndpoint;
        
        // Attempt to call logout API but don't wait for it to complete
        Api.post(ApiEndpoint.LOGOUT)
          .then(() => console.log('Server logout successful'))
          .catch(err => console.log('Server logout error (non-critical):', err));
          
        // Reset all store data immediately
        yield self.reset();
        
        return true;
      } catch (error) {
        console.error('Logout error:', error);
        // Still reset stores even if API call fails
        yield self.reset();
        return false;
      }
    }),
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
  auth: authStore,
  onboarding: OnboardingStore.create({}),
  employees: employeeStore,

  customers: customerStore,
  orders: OrderStore.create({ orders: [], isLoading: false, error: '' }),
  productStore: ProductStore.create({ products: [], isLoading: false, error: '', totalPrice: 0 }),
  promotionStore: PromotionStoreModel.create({ promotions: [], isLoading: false, error: '' }),
  providers: ProviderStoreModel.create({ providers: [], isLoading: false, error: '' }),
  warranty: WarrantyStoreModel.create({ warranties: [], isLoading: false, error: '' }),
});


