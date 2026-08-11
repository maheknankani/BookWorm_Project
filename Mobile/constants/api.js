import Constants from "expo-constants";
import { Platform } from "react-native";

const getApiUrl = () => {
  if (Platform.OS === "web") {
    return "http://127.0.0.1:3000/api";
  }

  // Extract host IP address from Expo bundler URI (e.g., 192.168.x.x:8081 -> 192.168.x.x)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:3000/api`;
  }

  return "http://10.0.2.2:3000/api"; // Default fallback for Android emulator
};

export const API_URL = getApiUrl();

