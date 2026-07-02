export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}
