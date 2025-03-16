import {flow, Instance, SnapshotOut, types} from 'mobx-state-tree';

export const AuthStoreModel = types
  .model('AuthStore')
  .props({
    accessToken: types.maybe(types.string),
    refreshToken: types.maybe(types.string),
    userId: types.maybe(types.string),
    email: types.maybe(types.string),
    username: types.maybe(types.string),
    password: types.maybe(types.string),
  })
  .actions(store => ({
    setUserId(uid: string) {
      store.userId = uid;
    },
    setEmail(value: string) {
      store.email = value.replace(/ /g, '');
    },
    setUsername(value: string) {
      store.username = value;
    },
    setPassword(value: string) {
      store.password = value;
    },
  }))
  .actions(store => ({
    login: flow(function* (username: string, password: string) {
      store.setUsername(username);
      store.setPassword(password);
    }),
  }));

export interface AuthStore extends Instance<typeof AuthStoreModel> {}
export interface AuthStoreSnapshot extends SnapshotOut<typeof AuthStoreModel> {}
