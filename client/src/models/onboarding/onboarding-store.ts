import { types, Instance, SnapshotIn, SnapshotOut, flow } from 'mobx-state-tree';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_ONBOARDING_KEY = '@onboarding_store';

export const OnboardingStore = types
  .model('OnboardingStore', {
    hasSeenOnboarding: types.optional(types.boolean, false),
  })
  .actions((self) => ({
    setHasSeenOnboarding: flow(function* (value: boolean) {
      self.hasSeenOnboarding = value;
      try {
        yield AsyncStorage.setItem(STORAGE_ONBOARDING_KEY, JSON.stringify({ hasSeenOnboarding: value }));
      } catch (error) {
        console.error('Error saving onboarding state:', error);
      }
    }),

    loadStoredOnboarding: flow(function* () {
      try {
        const storedData = yield AsyncStorage.getItem(STORAGE_ONBOARDING_KEY);
        if (storedData) {
          const data = JSON.parse(storedData);
          self.hasSeenOnboarding = data.hasSeenOnboarding;
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      }
    }),
  }));

export interface IOnboardingStore extends Instance<typeof OnboardingStore> {}
export interface IOnboardingStoreSnapshotIn extends SnapshotIn<typeof OnboardingStore> {}
export interface IOnboardingStoreSnapshotOut extends SnapshotOut<typeof OnboardingStore> {}

export const onboardingStore = OnboardingStore.create({});
