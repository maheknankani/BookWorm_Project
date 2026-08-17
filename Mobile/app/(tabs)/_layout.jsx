import { useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MoreDrawerModal from "../../components/MoreDrawerModal";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [moreDrawerVisible, setMoreDrawerVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          headerTitleStyle: {
            color: COLORS.textPrimary,
            fontWeight: "600",
          },
          headerShadowVisible: false,
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
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            href: null, // Hidden from tab bar directly, accessible via More menu
          }}
        />
        <Tabs.Screen
          name="more"
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
      </Tabs>

      {/* SLIDING RIGHT MORE DRAWER MENU */}
      <MoreDrawerModal
        visible={moreDrawerVisible}
        onClose={() => setMoreDrawerVisible(false)}
      />
    </>
  );
}
