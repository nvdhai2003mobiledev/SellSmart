import { types, Instance, SnapshotIn, SnapshotOut, flow, applySnapshot } from 'mobx-state-tree';
import { EmployeeResponse } from './employee';
import { Api } from '../../services/api/api';
import { ApiEndpoint } from '../../services/api/api-endpoint';
import { rootStore } from '../root-store';

// Model cho thông tin ngân hàng
const BankAccountModel = types.model('BankAccount', {
  bankName: types.maybeNull(types.string),
  accountNumber: types.maybeNull(types.string),
  accountHolder: types.maybeNull(types.string),
});

// Model cho thông tin user của nhân viên
const EmployeeUserModel = types.model('EmployeeUser', {
  id: types.string,
  username: types.string,
  fullName: types.string,
  email: types.string,
  phoneNumber: types.maybeNull(types.string),
  avatar: types.maybeNull(types.string),
  gender: types.maybeNull(types.string),
  role: types.enumeration('Role', ['admin', 'employee']),
});

// Model cho thông tin nhân viên
const EmployeeModel = types.model('Employee', {
  id: types.identifier,
  employeeId: types.string,
  user: EmployeeUserModel,
  department: types.string,
  position: types.string,
  salary: types.number,
  hireDate: types.string,
  workStatus: types.enumeration('WorkStatus', ['active', 'inactive', 'leave']),
  bankAccount: types.maybeNull(BankAccountModel),
  createdAt: types.string,
  updatedAt: types.string,
});

export const EmployeeStoreModel = types
  .model('EmployeeStore')
  .props({
    employees: types.array(EmployeeModel),
    isLoading: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
    selectedEmployeeId: types.maybeNull(types.string),
  })
  .views((self) => ({
    get selectedEmployee() {
      return self.selectedEmployeeId
        ? self.employees.find(e => e.id === self.selectedEmployeeId)
        : null;
    },

    get employeeList() {
      return self.employees;
    },

    get isLoadingEmployees() {
      return self.isLoading;
    },

    get employeeCount() {
      return self.employees.length;
    },

    getEmployeeById(id: string) {
      return self.employees.find((employee) => employee.id === id);
    },

    getEmployeeByEmployeeId(employeeId: string) {
      return self.employees.find((employee) => employee.employeeId === employeeId);
    },

    // Lọc nhân viên theo trạng thái làm việc
    getEmployeesByStatus(status: 'active' | 'inactive' | 'leave') {
      return self.employees.filter((employee) => employee.workStatus === status);
    },
  }))
  .actions((self) => {
    // Khai báo action setSelectedEmployee trong phạm vi này để sử dụng trong các hàm khác
    const setSelectedEmployee = (employeeId: string | null) => {
      self.selectedEmployeeId = employeeId;
    };

    return {
      setLoading(value: boolean) {
        self.isLoading = value;
      },

      setError(error: string | null) {
        self.error = error;
      },

      // Export action để có thể gọi từ bên ngoài
      setSelectedEmployee,

      fetchEmployees: flow(function* () {
        self.isLoading = true;
        self.error = null;
        let success = false;

        try {
          const response = yield Api.get(ApiEndpoint.EMPLOYEES);
          
          if (response.ok && response.data?.success) {
            const employees = response.data.data || [];

            // Xóa tất cả nhân viên hiện tại
            self.employees.clear();

            // Thêm nhân viên mới từ response
            employees.forEach((employee: EmployeeResponse) => {
              self.employees.push({
                id: employee._id,
                employeeId: employee.employeeId,
                user: {
                  id: employee.userId._id,
                  username: employee.userId.username,
                  fullName: employee.userId.fullName,
                  email: employee.userId.email,
                  phoneNumber: employee.userId.phoneNumber || null,
                  avatar: employee.userId.avatar || null,
                  gender: employee.userId.gender || null,
                  role: employee.userId.role,
                },
                department: employee.department,
                position: employee.position,
                salary: employee.salary,
                hireDate: employee.hireDate,
                workStatus: employee.workStatus,
                bankAccount: employee.bankAccount || null,
                createdAt: employee.createdAt,
                updatedAt: employee.updatedAt,
              });
            });
            success = true;
          } else if (response.status === 401) {
            // Kiểm tra nếu là lỗi xác thực, thử refresh token
            const authStore = rootStore.auth;
            
            // Thử refresh token
            const refreshSuccess = yield authStore.refreshAccessToken();
            
            if (refreshSuccess) {
              // Thử lại request sau khi refresh token thành công
              const retryResponse = yield Api.get(ApiEndpoint.EMPLOYEES);
              if (retryResponse.ok && retryResponse.data?.success) {
                const employees = retryResponse.data.data || [];
                self.employees.clear();
                
                employees.forEach((employee: EmployeeResponse) => {
                  self.employees.push({
                    id: employee._id,
                    employeeId: employee.employeeId,
                    user: {
                      id: employee.userId._id,
                      username: employee.userId.username,
                      fullName: employee.userId.fullName,
                      email: employee.userId.email,
                      phoneNumber: employee.userId.phoneNumber || null,
                      avatar: employee.userId.avatar || null,
                      gender: employee.userId.gender || null,
                      role: employee.userId.role,
                    },
                    department: employee.department,
                    position: employee.position,
                    salary: employee.salary,
                    hireDate: employee.hireDate,
                    workStatus: employee.workStatus,
                    bankAccount: employee.bankAccount || null,
                    createdAt: employee.createdAt,
                    updatedAt: employee.updatedAt,
                  });
                });
                success = true;
              } else {
                self.error = retryResponse.data?.message || 'Không thể tải danh sách nhân viên sau khi refresh token';
              }
            } else {
              // Nếu refresh token thất bại, hiển thị lỗi xác thực
              self.error = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
            }
          } else {
            self.error = response.data?.message || 'Không thể tải danh sách nhân viên';
          }
        } catch (error) {
          self.error = 'Đã xảy ra lỗi khi tải danh sách nhân viên';
          console.error('Error fetching employees:', error);
        } finally {
          self.isLoading = false;
        }

        return success;
      }),
      
      fetchEmployeeById: flow(function* (employeeId: string) {
        self.isLoading = true;
        self.error = null;
        let success = false;

        try {
          const response = yield Api.get(`${ApiEndpoint.EMPLOYEES}/${employeeId}`);

          if (response.ok && response.data?.success) {
            const employee = response.data.data;

            if (employee) {
              // Kiểm tra nếu nhân viên đã tồn tại trong store
              const existingEmployee = self.employees.find((emp) => emp.id === employee._id);

              if (!existingEmployee) {
                // Thêm nhân viên mới vào store nếu chưa tồn tại
                self.employees.push({
                  id: employee._id,
                  employeeId: employee.employeeId,
                  user: {
                    id: employee.userId._id,
                    username: employee.userId.username,
                    fullName: employee.userId.fullName,
                    email: employee.userId.email,
                    phoneNumber: employee.userId.phoneNumber || null,
                    avatar: employee.userId.avatar || null,
                    gender: employee.userId.gender || null,
                    role: employee.userId.role,
                  },
                  department: employee.department,
                  position: employee.position,
                  salary: employee.salary,
                  hireDate: employee.hireDate,
                  workStatus: employee.workStatus,
                  bankAccount: employee.bankAccount || null,
                  createdAt: employee.createdAt,
                  updatedAt: employee.updatedAt,
                });
              }

              // Đặt nhân viên này làm selectedEmployee
              setSelectedEmployee(employee._id);
              success = true;
            }
          } else {
            self.error = response.data?.message || 'Không thể tải thông tin nhân viên';
          }
        } catch (error) {
          self.error = 'Đã xảy ra lỗi khi tải thông tin nhân viên';
          console.error('Error fetching employee details:', error);
        } finally {
          self.isLoading = false;
        }

        return success;
      }),

      reset() {
        self.employees.clear();
        self.isLoading = false;
        self.error = null;
        self.selectedEmployeeId = null;
      },

      createEmployee: flow(function* (employeeData) {
        self.isLoading = true;
        self.error = null;
        let success = false;

        try {
          console.log('Dữ liệu gửi tới API:', employeeData);
          // Gửi trực tiếp dữ liệu theo định dạng API yêu cầu
          const response = yield Api.post(ApiEndpoint.EMPLOYEES, employeeData);
          console.log('Kết quả từ API:', response);

          if (response.ok && response.data?.success) {
            // Nếu tạo thành công, gọi lại API để cập nhật danh sách
            try {
              const employeesResponse = yield Api.get(ApiEndpoint.EMPLOYEES);
              if (employeesResponse.ok && employeesResponse.data?.success) {
                const employees = employeesResponse.data.data || [];
                // Xóa tất cả nhân viên hiện tại
                self.employees.clear();
                // Thêm nhân viên mới từ response
                employees.forEach((employee: EmployeeResponse) => {
                  self.employees.push({
                    id: employee._id,
                    employeeId: employee.employeeId,
                    user: {
                      id: employee.userId._id,
                      username: employee.userId.username,
                      fullName: employee.userId.fullName,
                      email: employee.userId.email,
                      phoneNumber: employee.userId.phoneNumber || null,
                      avatar: employee.userId.avatar || null,
                      gender: employee.userId.gender || null,
                      role: employee.userId.role,
                    },
                    department: employee.department,
                    position: employee.position,
                    salary: employee.salary,
                    hireDate: employee.hireDate,
                    workStatus: employee.workStatus,
                    bankAccount: employee.bankAccount || null,
                    createdAt: employee.createdAt,
                    updatedAt: employee.updatedAt,
                  });
                });
              }
            } catch (refreshError) {
              console.error('Error refreshing employee list:', refreshError);
            }
            success = true;
          } else if (response.status === 401) {
            // Kiểm tra nếu là lỗi xác thực, thử refresh token
            const authStore = rootStore.auth;
            
            // Thử refresh token
            const refreshSuccess = yield authStore.refreshAccessToken();
            
            if (refreshSuccess) {
              // Thử lại request sau khi refresh token thành công
              const retryResponse = yield Api.post(ApiEndpoint.EMPLOYEES, employeeData);
              if (retryResponse.ok && retryResponse.data?.success) {
                success = true;
                // Làm mới danh sách nhân viên sau khi thêm thành công
                yield self.fetchEmployees();
              } else {
                self.error = retryResponse.data?.message || 'Không thể tạo nhân viên mới sau khi refresh token';
              }
            } else {
              // Nếu refresh token thất bại, hiển thị lỗi xác thực
              self.error = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
            }
          } else {
            self.error = response.data?.message || 'Không thể tạo nhân viên mới';
            console.error('API responded with error:', response.data);
          }
        } catch (error: any) {
          self.error = error.message || 'Đã xảy ra lỗi khi tạo nhân viên mới';
          console.error('Error creating employee:', error);
        } finally {
          self.isLoading = false;
        }

        return success;
      }),

      updateEmployee: flow(function* (employeeId, employeeData) {
        self.isLoading = true;
        self.error = null;
        let success = false;

        try {
          const response = yield Api.put(`${ApiEndpoint.EMPLOYEES}/${employeeId}`, employeeData);

          if (response.ok && response.data?.success) {
            // If update was successful, refresh the entire employee list
            try {
              const employeesResponse = yield Api.get(ApiEndpoint.EMPLOYEES);
              if (employeesResponse.ok && employeesResponse.data?.success) {
                const employees = employeesResponse.data.data || [];
                // Xóa tất cả nhân viên hiện tại
                self.employees.clear();
                // Thêm nhân viên mới từ response
                employees.forEach((employee: EmployeeResponse) => {
                  self.employees.push({
                    id: employee._id,
                    employeeId: employee.employeeId,
                    user: {
                      id: employee.userId._id,
                      username: employee.userId.username,
                      fullName: employee.userId.fullName,
                      email: employee.userId.email,
                      phoneNumber: employee.userId.phoneNumber || null,
                      avatar: employee.userId.avatar || null,
                      gender: employee.userId.gender || null,
                      role: employee.userId.role,
                    },
                    department: employee.department,
                    position: employee.position,
                    salary: employee.salary,
                    hireDate: employee.hireDate,
                    workStatus: employee.workStatus,
                    bankAccount: employee.bankAccount || null,
                    createdAt: employee.createdAt,
                    updatedAt: employee.updatedAt,
                  });
                });
              }
            } catch (refreshError) {
              console.error('Error refreshing employee list:', refreshError);
            }
            success = true;
          } else {
            self.error = response.data?.message || 'Không thể cập nhật thông tin nhân viên';
          }
        } catch (error) {
          self.error = 'Đã xảy ra lỗi khi cập nhật thông tin nhân viên';
          console.error('Error updating employee:', error);
        } finally {
          self.isLoading = false;
        }

        return success;
      }),

      deleteEmployee: flow(function* (employeeId) {
        self.isLoading = true;
        self.error = null;
        let success = false;

        try {
          console.log('Đang thực hiện xóa nhân viên:', employeeId);
          const response = yield Api.delete(`${ApiEndpoint.EMPLOYEES}/${employeeId}`);
          console.log('Kết quả xóa:', response);

          if (response.ok && response.data?.success) {
            // Xóa nhân viên khỏi danh sách trong store
            const index = self.employees.findIndex(employee => employee.id === employeeId || employee.employeeId === employeeId);
            if (index !== -1) {
              self.employees.splice(index, 1);
              console.log('Đã xóa nhân viên khỏi store, index:', index);
              success = true;
            } else {
              console.log('Không tìm thấy nhân viên trong store để xóa');
              self.error = 'Không tìm thấy nhân viên trong danh sách';
            }
          } else if (response.status === 401) {
            // Kiểm tra nếu là lỗi xác thực, thử refresh token
            const authStore = rootStore.auth;
            
            // Thử refresh token
            const refreshSuccess = yield authStore.refreshAccessToken();
            
            if (refreshSuccess) {
              // Thử lại request sau khi refresh token thành công
              const retryResponse = yield Api.delete(`${ApiEndpoint.EMPLOYEES}/${employeeId}`);
              if (retryResponse.ok && retryResponse.data?.success) {
                const index = self.employees.findIndex(employee => employee.id === employeeId || employee.employeeId === employeeId);
                if (index !== -1) {
                  self.employees.splice(index, 1);
                  success = true;
                }
              } else {
                self.error = retryResponse.data?.message || 'Không thể xóa nhân viên sau khi refresh token';
              }
            } else {
              // Nếu refresh token thất bại, hiển thị lỗi xác thực
              self.error = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
            }
          } else {
            self.error = response.data?.message || 'Không thể xóa nhân viên';
          }
        } catch (error: any) {
          self.error = error.message || 'Đã xảy ra lỗi khi xóa nhân viên';
          console.error('Error deleting employee:', error);
        } finally {
          self.isLoading = false;
        }

        return success;
      }),

      searchEmployees(searchQuery: string) {
        if (!searchQuery || searchQuery.trim() === '') {
          return self.employees;
        }

        const query = searchQuery.toLowerCase().trim();
        return self.employees.filter(employee => {
          return (
            employee.user.fullName.toLowerCase().includes(query) ||
            employee.employeeId.toLowerCase().includes(query) ||
            employee.user.email.toLowerCase().includes(query) ||
            (employee.user.phoneNumber && employee.user.phoneNumber.toLowerCase().includes(query)) ||
            employee.department.toLowerCase().includes(query) ||
            employee.position.toLowerCase().includes(query)
          );
        });
      },
    };
  });

export interface IEmployeeStore extends Instance<typeof EmployeeStoreModel> {}
export interface IEmployeeStoreSnapshotIn extends SnapshotIn<typeof EmployeeStoreModel> {}
export interface IEmployeeStoreSnapshotOut extends SnapshotOut<typeof EmployeeStoreModel> {}

export const employeeStore = EmployeeStoreModel.create({
  employees: [],
  isLoading: false,
  error: null,
  selectedEmployeeId: null,
});
