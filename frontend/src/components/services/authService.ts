import api from "./api";

// Define the shape of the register form data
interface RegisterFormData {
  email: string;
  password: string;
  name?: string; // Add other optional or required fields as needed
}

// Define the shape of the login response (example)
interface AuthResponse {
  token: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  [key: string]: any; // In case there are extra properties
}

export const register = async (formData: RegisterFormData): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/register", formData);
  return res.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const formData = { email, password };
  const res = await api.post<AuthResponse>("/auth/login", formData);
  // Save token
  localStorage.setItem("token", res.data.token);
  return res.data;
};
