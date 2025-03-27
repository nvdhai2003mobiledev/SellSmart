import { types, Instance, SnapshotIn, SnapshotOut } from 'mobx-state-tree';
import { AuthStore, authStore } from './auth/auth-store';
import { OnboardingStore } from './onboarding/onboarding-store';
import { EmployeeStoreModel, employeeStore } from './employee/employee-store';

const RootStoreModel = types
  .model('RootStore', {
    auth: types.late(() => AuthStore),
    onboarding: types.late(() => OnboardingStore),
    employees: types.late(() => EmployeeStoreModel),
  })
  .actions((self) => ({
    reset() {
      self.auth.clearAuth();
      self.onboarding.setHasSeenOnboarding(false);
      self.employees.reset();
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

// Create and export the root store instance at the very end
export const rootStore = RootStoreModel.create({
  auth: authStore,
  onboarding: OnboardingStore.create({}),
  employees: employeeStore,
  
});
