import Constants from "expo-constants";
import { Platform } from "react-native";

const getApiUrl = () => {
  // If explicitly using local development server on port 3000:
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:3000/api`;
  }

  // Fallback to Vercel Production API endpoint
  return "https://book-worm-project-mauve.vercel.app/api";
};

export const API_URL = getApiUrl();
