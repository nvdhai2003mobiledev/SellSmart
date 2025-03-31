export interface CustomerResponse {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  address: string;
  avatar?: string;
}

export interface CustomersListResponse {
  success: boolean;
  message?: string;
  data?: CustomerResponse[];
}

export interface CustomerDetailResponse {
  success: boolean;
  message?: string;
  data?: CustomerResponse;
}