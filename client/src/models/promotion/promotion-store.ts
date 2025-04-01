import { types, Instance } from 'mobx-state-tree';
import { PromotionModel, IPromotion } from './promotion';

export const PromotionStoreModel = types
  .model('PromotionStore', {
    promotions: types.array(PromotionModel),
    isLoading: types.optional(types.boolean, false),
    error: types.optional(types.string, ''),
  })
  .actions((self) => ({
    setPromotions(promotions: IPromotion[]) {
      if (Array.isArray(promotions)) {
        self.promotions.replace(promotions);
      } else {
        console.error('setPromotions received non-array data:', promotions);
        self.promotions.clear();
      }
    },
    addPromotion(promotion: IPromotion) {
      self.promotions.push(promotion);
    },
    updatePromotion(promotion: IPromotion) {
      const index = self.promotions.findIndex((p) => p._id === promotion._id);
      if (index !== -1) {
        self.promotions[index] = promotion;
      }
    },
    deletePromotion(id: string) {
      const index = self.promotions.findIndex((p) => p._id === id);
      if (index !== -1) {
        self.promotions.splice(index, 1);
      }
    },
    setLoading(loading: boolean) {
      self.isLoading = loading;
    },
    setError(error: string) {
      self.error = error;
    },
    reset() {
      self.promotions.clear();
      self.isLoading = false;
      self.error = '';
    },
  }))
  .views((self) => ({
    get activePromotions() {
      return self.promotions.filter((p) => p.status === 'active');
    },
    get upcomingPromotions() {
      return self.promotions.filter((p) => p.status === 'sapdienra');
    },
    get expiredPromotions() {
      return self.promotions.filter((p) => p.status === 'expired');
    },
  }));

export interface IPromotionStore extends Instance<typeof PromotionStoreModel> {}
