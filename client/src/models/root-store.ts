import { types, Instance, SnapshotIn, SnapshotOut } from 'mobx-state-tree';
import { AuthStore, authStore } from './auth/auth-store';
import { OnboardingStore } from './onboarding/onboarding-store';
import { EmployeeStoreModel, employeeStore } from './employee/employee-store';
import { OrderStore } from './Order/Order';

const RootStoreModel = types
  .model('RootStore', {
    auth: types.late(() => AuthStore),
    onboarding: types.late(() => OnboardingStore),
    employees: types.late(() => EmployeeStoreModel),
    orders: types.late(() => OrderStore),
  })
  .actions((self) => ({
    reset() {
      self.auth.clearAuth();
      self.onboarding.setHasSeenOnboarding(false);
      self.employees.reset();
      self.orders.reset(); // Add order store reset
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
  }));

export interface IRootStore extends Instance<typeof RootStoreModel> {}
export interface IRootStoreSnapshotIn extends SnapshotIn<typeof RootStoreModel> {}
export interface IRootStoreSnapshotOut extends SnapshotOut<typeof RootStoreModel> {}

// Create and export the root store instance
export const rootStore = RootStoreModel.create({
  auth: authStore,
  onboarding: OnboardingStore.create({}),
  employees: employeeStore,
  orders: OrderStore.create({ orders: [], isLoading: false, error: '' }),
});