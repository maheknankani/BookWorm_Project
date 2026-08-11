import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { AlertProvider } from "../context/AlertContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { checkAuth, user, token } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  useEffect(() => {
    let isMounted = true;
    const prepare = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.warn("Auth check error:", err);
      } finally {
        if (isMounted) {
          setAppReady(true);
        }
      }
    };
    prepare();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (appReady && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady, fontsLoaded]);

  // handle navigation after everything is ready
  useEffect(() => {
    if (!appReady || !fontsLoaded) return;

    const inAuthScreen = segments[0] === "(auth)";
    const isSignedIn = user && token;

    if (!isSignedIn && !inAuthScreen) {
      router.replace("/(auth)");
    } else if (isSignedIn && inAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [user, token, segments, appReady, fontsLoaded]);

  if (!appReady || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
        <StatusBar style="dark" />
      </AlertProvider>
    </SafeAreaProvider>
  );
}
