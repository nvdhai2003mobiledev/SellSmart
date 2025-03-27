export interface EmployeeResponse {
  userId: {
    _id: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    avatar?: string;
    gender?: string;
    role: 'admin' | 'employee';
  };
  _id: string;
  employeeId: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  workStatus: 'active' | 'inactive' | 'leave';
  bankAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesListResponse {
  success: boolean;
  message?: string;
  data?: EmployeeResponse[];
}

export interface EmployeeDetailResponse {
  success: boolean;
  message?: string;
  data?: EmployeeResponse;
}
