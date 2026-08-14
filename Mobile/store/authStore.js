import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: true,

  register: async (username, email, password) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Register server response:", text);
        throw new Error(`Server returned: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({
        token: data.token,
        user: data.user,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      console.log("Register error:", error);
      set({ isLoading: false });

      return {
        success: false,
        error: error.message,
      };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const text = await response.text();

      console.log("Login status:", response.status);
      console.log("Login response:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({
        token: data.token,
        user: data.user,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      console.log("Login error:", error);

      set({ isLoading: false });

      return {
        success: false,
        error: error.message,
      };
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      set({ token, user });
    } catch (error) {
      console.log("Auth check failed", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  updateUser: async (updatedUser) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (err) {
      console.log("Error updating user in storage", err);
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.log("Logout failed", error);
    } finally {
      set({
        token: null,
        user: null,
        isLoading: false,
      });
    }
  },

  sendForgotPasswordOtp: async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned HTML error (${response.status}). If using Vercel production API, please deploy the updated backend code.`);
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  verifyForgotPasswordOtp: async (email, otp) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned HTML error (${response.status}). Please verify API deployment or local server.`);
      }
      if (!response.ok) {
        throw new Error(data.message || "Invalid or expired OTP");
      }
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned HTML error (${response.status}). Please verify API deployment or local server.`);
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));