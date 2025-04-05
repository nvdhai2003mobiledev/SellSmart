import { Instance, SnapshotIn, SnapshotOut, types } from 'mobx-state-tree';

export const ProviderModel = types.model('Provider').props({
  _id: types.identifier,
  fullName: types.string,
  email: types.string,
  phoneNumber: types.string,
  address: types.string,
  status: types.enumeration(['cung cấp', 'dừng cung cấp']),
  createdAt: types.maybe(types.string),
  updatedAt: types.maybe(types.string),
});

export interface Provider extends Instance<typeof ProviderModel> {}
export interface ProviderSnapshotOut extends SnapshotOut<typeof ProviderModel> {}
export interface ProviderSnapshotIn extends SnapshotIn<typeof ProviderModel> {} 