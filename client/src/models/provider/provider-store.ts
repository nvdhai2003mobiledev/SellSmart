import { types, Instance, SnapshotIn, SnapshotOut, flow } from 'mobx-state-tree';
import { Provider, ProviderModel } from './provider';
import { ProviderApiService } from '../../services/api/providerAPI';
import { Api } from '../../services/api/api';
import { ApiEndpoint } from '../../services/api/api-endpoint';

export const ProviderStoreModel = types
  .model('ProviderStore', {
    providers: types.array(ProviderModel),
    isLoading: types.optional(types.boolean, false),
    error: types.maybe(types.string),
  })
  .views((self) => ({
    get providersList() {
      return self.providers;
    },
    get loading() {
      return self.isLoading;
    },
    get errorMessage() {
      return self.error;
    },
    get providerCount() {
      return self.providers.length;
    }
  }))
  .actions((self) => {
    const setLoading = (loading: boolean) => {
      self.isLoading = loading;
    };

    const setError = (error: string | undefined) => {
      self.error = error;
    };

    const setProviders = (providers: Provider[]) => {
      self.providers.replace(providers);
    };

    const addProvider = (provider: Provider) => {
      self.providers.push(provider);
    };

    const updateProvider = (provider: Provider) => {
      const index = self.providers.findIndex((p) => p._id === provider._id);
      if (index !== -1) {
        self.providers[index] = provider;
      }
    };

    const removeProvider = (id: string) => {
      const index = self.providers.findIndex((p) => p._id === id);
      if (index !== -1) {
        self.providers.splice(index, 1);
      }
    };

    const reset = () => {
      self.providers.clear();
      self.isLoading = false;
      self.error = undefined;
    };

    const fetchProviders = flow(function* () {
      setLoading(true);
      try {
        const response = yield Api.get(ApiEndpoint.PROVIDERS);
        if (response.ok && response.data?.status === 'Ok') {
          const providers = response.data.data || [];
          setProviders(providers);
        } else {
          setError('Không thể tải danh sách nhà cung cấp');
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách nhà cung cấp:', error);
        setError('Đã xảy ra lỗi khi tải danh sách nhà cung cấp');
      } finally {
        setLoading(false);
      }
    });

    const searchProviders = flow(function* (phone: string) {
      setLoading(true);
      try {
        const result = yield ProviderApiService.searchProvidersByPhone(phone);
        if (result.kind === 'ok') {
          setProviders(result.providers);
        } else {
          setError('Không tìm thấy nhà cung cấp');
        }
      } catch (error) {
        setError('Đã xảy ra lỗi khi tìm kiếm nhà cung cấp');
      } finally {
        setLoading(false);
      }
    });

    return {
      setLoading,
      setError,
      setProviders,
      addProvider,
      updateProvider,
      removeProvider,
      reset,
      fetchProviders,
      searchProviders
    };
  });

export interface IProviderStore extends Instance<typeof ProviderStoreModel> {}
export interface IProviderStoreSnapshotIn extends SnapshotIn<typeof ProviderStoreModel> {}
export interface IProviderStoreSnapshotOut extends SnapshotOut<typeof ProviderStoreModel> {}

export const providerStore = ProviderStoreModel.create({
  providers: [],
  isLoading: false,
  error: undefined,
}); 