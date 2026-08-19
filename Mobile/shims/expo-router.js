export { useRouter, useLocalSearchParams } from "../navigation/router";

export const Stack = ({ children }) => children || null;
export const Tabs = ({ children }) => children || null;

export const SplashScreen = {
  preventAutoHideAsync: async () => {},
  hideAsync: async () => {},
};
