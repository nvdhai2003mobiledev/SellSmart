import { types, Instance } from 'mobx-state-tree';

export const PromotionModel = types
  .model('Promotion', {
    _id: types.identifier,
    name: types.string,
    discount: types.number,
    minOrderValue: types.number,
    maxDiscount: types.number,
    status: types.enumeration('Status', ['sapdienra', 'active', 'expired']),
    startDate: types.string,
    endDate: types.string,
    createdAt: types.optional(types.string, ''),
    updatedAt: types.optional(types.string, ''),
  })
  .actions((self) => ({
    setName(name: string) {
      self.name = name;
    },
    setDiscount(discount: number) {
      self.discount = discount;
    },
    setMinOrderValue(value: number) {
      self.minOrderValue = value;
    },
    setMaxDiscount(value: number) {
      self.maxDiscount = value;
    },
    setStatus(status: 'sapdienra' | 'active' | 'expired') {
      self.status = status;
    },
    setStartDate(date: string) {
      self.startDate = date;
    },
    setEndDate(date: string) {
      self.endDate = date;
    },
  }));

export interface IPromotion extends Instance<typeof PromotionModel> {}
