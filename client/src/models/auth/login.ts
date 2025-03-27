export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  role: 'admin' | 'employee';
  fullName: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  dob?: string;
}
