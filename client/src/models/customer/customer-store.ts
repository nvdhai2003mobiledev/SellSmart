import { types, Instance, SnapshotIn, SnapshotOut, flow } from 'mobx-state-tree';
import { CustomerResponse } from './customer';
import { ApiService } from '../../services/api/customerAPI';

// Model cho thông tin khách hàng
const CustomerModel = types.model('Customer', {
  _id: types.identifier,
  fullName: types.string,
  phoneNumber: types.string,
  email: types.string,
  birthDate: types.maybeNull(types.string), // Cho phép null để khớp dữ liệu API
  address: types.string,
  avatar: types.maybeNull(types.string),
});

// Helper functions outside of the model
const detachCustomer = (customer: any) => {
  return {
    _id: customer._id,
    fullName: customer.fullName,
    phoneNumber: customer.phoneNumber,
    email: customer.email,
    birthDate: customer.birthDate,
    address: customer.address,
    avatar: customer.avatar,
  };
};

export const CustomerStoreModel = types
  .model('CustomerStore')
  .props({
    customers: types.array(CustomerModel),
    isLoading: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
    selectedCustomerId: types.maybeNull(types.string),
    searchResults: types.array(CustomerModel),
    isSearching: types.optional(types.boolean, false),
  })
  .views((self) => ({
    get selectedCustomer() {
      return self.selectedCustomerId
        ? self.customers.find((c) => c._id === self.selectedCustomerId)
        : null;
    },
    get customerList() {
      return self.customers;
    },
    get isLoadingCustomers() {
      return self.isLoading;
    },
    get customerCount() {
      return self.customers.length;
    },
    getCustomerById(id: string) {
      return self.customers.find((customer) => customer._id === id) || null;
    },
    searchCustomersByPhone(phone: string) {
      if (!phone || phone.trim() === '') return [];
      // Create new objects instead of returning the existing ones to avoid MobX state tree error
      const matchingCustomers = self.customers.filter(customer => 
        customer.phoneNumber.includes(phone)
      );
      
      // Create new detached objects with the same data
      return matchingCustomers.map(customer => detachCustomer(customer));
    },
  }))
  .actions((self) => {
    // Define the action methods first so they can be used in flow generators
    const setLoading = (value: boolean) => {
      self.isLoading = value;
    };
    
    const setError = (error: string | null) => {
      self.error = error;
    };
    
    const setSelectedCustomer = (customerId: string | null) => {
      self.selectedCustomerId = customerId;
    };
    
    const setIsSearching = (value: boolean) => {
      self.isSearching = value;
    };
    
    const reset = () => {
      self.customers.clear();
      setLoading(false);
      setError(null);
      self.selectedCustomerId = null;
    };
    
    const clearSearchResults = () => {
      self.searchResults.replace([]);
    };
    
    // Return all actions including flow generators
    return {
      setLoading,
      setError,
      setSelectedCustomer,
      setIsSearching,
      reset,
      clearSearchResults,
      
      fetchCustomers: flow(function* () {
        setLoading(true);
        setError(null);
        try {
          console.log('📌 Gọi API lấy danh sách khách hàng...');
          const result = yield ApiService.getCustomers();
          console.log('📌 Kết quả thô từ ApiService.getCustomers():', result);
      
          // Kiểm tra nếu result là một object với kind và customers
          if (result && result.kind === 'ok' && Array.isArray(result.customers)) {
            console.log('✅ Cập nhật danh sách khách hàng từ result.customers:', result.customers);
            self.customers.replace(
              result.customers.map((customer: CustomerResponse) => ({
                _id: customer._id,
                fullName: customer.fullName,
                phoneNumber: customer.phoneNumber,
                email: customer.email,
                birthDate: customer.birthDate,
                address: customer.address,
                avatar: typeof customer.avatar === 'string' && customer.avatar.trim() !== '' ? customer.avatar : null,
              }))
            );
          } 
          // Kiểm tra nếu result trực tiếp là một mảng
          else if (Array.isArray(result)) {
            console.log('✅ Cập nhật danh sách khách hàng từ mảng trực tiếp:', result);
            self.customers.replace(
              result.map((customer: CustomerResponse) => ({
                _id: customer._id,
                fullName: customer.fullName,
                phoneNumber: customer.phoneNumber,
                email: customer.email,
                birthDate: customer.birthDate,
                address: customer.address,
                avatar: typeof customer.avatar === 'string' && customer.avatar.trim() !== '' ? customer.avatar : null,
              }))
            );
          } else if (result && result.kind !== 'ok' && result.message) {
            // Xử lý các loại lỗi có thông báo
            console.error(`❌ Lỗi API (${result.kind}):`, result.message);
            setError(result.message);
          } else {
            console.error('❌ API trả về dữ liệu không đúng:', result);
            setError(`Dữ liệu khách hàng không đúng định dạng: ${JSON.stringify(result)}`);
          }
        } catch (error: any) {
          console.error('❌ Lỗi kết nối:', error);
          setError(`Lỗi kết nối: ${error.message || 'Không xác định'}`);
        } finally {
          setLoading(false);
        }
      }),
      
      searchCustomers: flow(function* (phoneNumber: string) {
        if (!phoneNumber || phoneNumber.trim() === '') {
          self.searchResults.replace([]);
          return;
        }
        
        setIsSearching(true);
        try {
          // First try local search (which already creates new objects using detachCustomer)
          const localResults = self.searchCustomersByPhone(phoneNumber);
          self.searchResults.replace(localResults); // Use replace directly on array
          
          // Then try API search if needed
          if (localResults.length === 0) {
            console.log('📱 Tìm kiếm khách hàng theo số điện thoại:', phoneNumber);
            const result = yield ApiService.searchCustomersByPhone(phoneNumber);
            
            if (result && result.kind === 'ok' && Array.isArray(result.customers)) {
              console.log('✅ Kết quả tìm kiếm từ API:', result.customers);
              // Make sure all results are properly detached plain objects
              const formattedResults = result.customers.map((customer: CustomerResponse) => ({
                _id: customer._id,
                fullName: customer.fullName || '',  // Ensure required fields have default values
                phoneNumber: customer.phoneNumber || '',
                email: customer.email || '',
                birthDate: customer.birthDate || null,
                address: customer.address || '',
                avatar: typeof customer.avatar === 'string' && customer.avatar.trim() !== '' ? customer.avatar : null,
              }));
              self.searchResults.replace(formattedResults); // Use replace directly on array
            } else if (result && result.kind !== 'ok' && result.message) {
              // Xử lý các loại lỗi khác với thông báo
              console.error(`❌ Lỗi API (${result.kind}):`, result.message);
              setError(result.message);
            }
          }
        } catch (error: any) {
          console.error('❌ Lỗi khi tìm kiếm khách hàng:', error);
          setError(`Lỗi tìm kiếm: ${error.message || 'Không xác định'}`);
        } finally {
          setIsSearching(false);
        }
      }),
    };
  });

export interface ICustomerStore extends Instance<typeof CustomerStoreModel> {}
export interface ICustomerStoreSnapshotIn extends SnapshotIn<typeof CustomerStoreModel> {}
export interface ICustomerStoreSnapshotOut extends SnapshotOut<typeof CustomerStoreModel> {}

export const customerStore = CustomerStoreModel.create({
  customers: [],
  isLoading: false,
  error: null,
  selectedCustomerId: null,
  searchResults: [],
  isSearching: false,
});