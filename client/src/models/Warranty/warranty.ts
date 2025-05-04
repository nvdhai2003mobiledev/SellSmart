import { Instance, SnapshotIn, SnapshotOut, types } from 'mobx-state-tree';

export const WarrantyModel = types.model('Warranty').props({
  _id: types.identifier,
  customerName: types.string,
  customerPhone: types.string,
  customerEmail: types.string,
  productId: types.string,
  supportDate: types.string,
  issue: types.string,
  status: types.enumeration(['pending', 'processing', 'completed']),
  createdAt: types.string,
  updatedAt: types.string,
  notes: types.maybe(types.string),
});

export interface Warranty extends Instance<typeof WarrantyModel> {}
export interface WarrantySnapshotOut extends SnapshotOut<typeof WarrantyModel> {}
export interface WarrantySnapshotIn extends SnapshotIn<typeof WarrantyModel> {}