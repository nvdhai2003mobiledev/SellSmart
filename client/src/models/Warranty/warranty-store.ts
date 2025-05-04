import { types, Instance, SnapshotIn, SnapshotOut, flow } from 'mobx-state-tree';
import { WarrantyModel, Warranty } from './warranty';
import { Api } from '../../services/api/api';
import { ApiEndpoint } from '../../services/api/api-endpoint';
import { WarrantyApiService } from '../../services/api/warrantyAPI';

export const WarrantyStoreModel = types
  .model('WarrantyStore', {
    warranties: types.array(WarrantyModel),
    isLoading: types.optional(types.boolean, false),
    error: types.maybe(types.string),
  })
  .views((self) => ({
    get warrantyList() {
      return self.warranties;
    },
    get loading() {
      return self.isLoading;
    },
    get errorMessage() {
      return self.error;
    },
    get warrantyCount() {
      return self.warranties.length;
    },
  }))
  .actions((self) => {
    const setLoading = (loading: boolean) => {
      self.isLoading = loading;
    };

    const setError = (error: string | undefined) => {
      self.error = error;
    };

    const setWarranties = (warranties: Warranty[]) => {
      self.warranties.replace(warranties);
    };

    const reset = () => {
      self.warranties.clear();
      self.isLoading = false;
      self.error = undefined;
    };

    const fetchWarranties = flow(function* () {
        setLoading(true);
        try {
          const response = yield WarrantyApiService.getWarranties();
          console.log('Data fetched in WarrantyStore:', response); // Log dữ liệu trả về từ API
          if (response && Array.isArray(response)) {
            setWarranties(response);
          } else {
            setError('Không thể tải danh sách bảo hành');
          }
        } catch (error) {
          console.error('Error in WarrantyStore fetchWarranties:', error); // Log lỗi chi tiết
          setError('Đã xảy ra lỗi khi tải danh sách bảo hành');
        } finally {
          setLoading(false);
        }
      });

    return {
      setLoading,
      setError,
      setWarranties,
      reset,
      fetchWarranties,
    };
  });

export interface IWarrantyStore extends Instance<typeof WarrantyStoreModel> {}
export interface IWarrantyStoreSnapshotIn extends SnapshotIn<typeof WarrantyStoreModel> {}
export interface IWarrantyStoreSnapshotOut extends SnapshotOut<typeof WarrantyStoreModel> {}

export const warrantyStore = WarrantyStoreModel.create({
  warranties: [],
  isLoading: false,
  error: undefined,
});