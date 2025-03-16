export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
}
