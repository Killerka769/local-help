export interface RegisterData {
    name: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }
  
export interface LoginData {
    phone: string;
    password: string;
  }
  
export interface User {
    id: string;
    name: string;
    phone: string;
    avatar?: string | null;
    description?: string | null;
    createdAt: string;
  }
  
export interface AuthResponse {
    success: boolean;
    user: User;
    error?: string;
  }