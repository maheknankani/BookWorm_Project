import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StatusBar, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

import { useAuthStore } from "./store/authStore";
import { AlertProvider } from "./context/AlertContext";
import COLORS from "./constants/colors";

// Screen Components
import SplashScreen from "./app/index";
import LoginScreen from "./app/(auth)/index";
import SignupScreen from "./app/(auth)/signup";
import HomeScreen from "./app/(tabs)/index";
import CreateScreen from "./app/(tabs)/create";
import LibraryScreen from "./app/(tabs)/library";
import ProfileScreen from "./app/(tabs)/profile";
import AboutScreen from "./app/(tabs)/about";
import NotificationsScreen from "./app/notifications";
import BookDetailsScreen from "./app/book/[id]";
import PdfViewerScreen from "./app/book/pdf-viewer";
import HelpSupportScreen from "./app/help-support";
import MoreDrawerModal from "./components/MoreDrawerModal";

const Stack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Signup" component={SignupScreen} />
    </AuthStackNav.Navigator>
  );
}

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const [moreDrawerVisible, setMoreDrawerVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.cardBackground,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 6,
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom,
          },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="CreateTab"
          component={CreateScreen}
          options={{
            title: "Create",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="LibraryTab"
          component={LibraryScreen}
          options={{
            title: "Library",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="MoreTab"
          component={View}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setMoreDrawerVisible(true);
            },
          }}
          options={{
            title: "More",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "menu" : "menu-outline"} size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <MoreDrawerModal
        visible={moreDrawerVisible}
        onClose={() => setMoreDrawerVisible(false)}
      />
    </>
  );
}

function MainApp() {
  const { checkAuth } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const prepare = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.warn("Auth check error:", err);
      } finally {
        if (isMounted) setAppReady(true);
      }
    };
    prepare();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!appReady) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="AuthStack" component={AuthNavigator} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <MainApp />
      </AlertProvider>
    </SafeAreaProvider>
  );
}
