import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlert } from "../context/AlertContext";
import HelpSupportModal from "./HelpSupportModal";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(width * 0.8, 320);

export default function MoreDrawerModal({ visible, onClose }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (path) => {
    onClose();
    setTimeout(() => {
      router.push(path);
    }, 150);
  };

  const handleShowHelp = () => {
    onClose();
    setTimeout(() => {
      setHelpModalVisible(true);
    }, 200);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      showAlert({
        title: "Log Out",
        message: "Are you sure you want to log out of BookWorm?",
        type: "warning",
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => {
              const { logout } = useAuthStore.getState();
              await logout();
              router.replace("/(auth)");
            },
          },
        ],
      });
    }, 200);
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

          {/* BACKDROP TAP TO CLOSE */}
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          </Animated.View>

          {/* RIGHT SLIDING DRAWER CONTAINER */}
          <Animated.View
            style={[
              styles.drawerCard,
              { transform: [{ translateX }] },
            ]}
          >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
              {/* DRAWER HEADER */}
              <View style={styles.header}>
                <Text style={styles.menuTitle}>App Navigation</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* USER PROFILE CARD */}
              {user && (
                <TouchableOpacity
                  style={styles.userCard}
                  onPress={() => handleNavigate("/(tabs)/profile")}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: user.profileImage || "https://avatar.iran.liara.run/public" }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.username} numberOfLines={1}>
                      {user.username}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      View Profile
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}

              {/* UNIQUE NON-DUPLICATED MENU ITEMS */}
              <View style={styles.menuList}>

                {/* NOTIFICATIONS */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate("/notifications")}
                >
                  <View style={[styles.iconBox, { backgroundColor: "#eef7ee" }]}>
                    <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuText}>Notifications</Text>
                    <Text style={styles.menuSubtext}>Likes & comments activity</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {/* ABOUT BOOKWORM */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate("/about")}
                >
                  <View style={[styles.iconBox, { backgroundColor: "#f0f4ff" }]}>
                    <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuText}>About BookWorm</Text>
                    <Text style={styles.menuSubtext}>App guide & features</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {/* HELP & SUPPORT */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate("/help-support")}
                >
                  <View style={[styles.iconBox, { backgroundColor: "#fdf4ff" }]}>
                    <Ionicons name="help-circle-outline" size={20} color="#a855f7" />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuText}>Help & Support</Text>
                    <Text style={styles.menuSubtext}>Tips & community feedback</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* FOOTER & LOGOUT BUTTON */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color="#e53935" />
                  <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
                <Text style={styles.versionSubText}>BookWorm v1.0.0 • Community Reader</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {/* HELP & SUPPORT MODAL */}
      <HelpSupportModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawerCard: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: COLORS.cardBackground,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
    paddingHorizontal: 16,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  menuList: {
    gap: 12,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  menuSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: "auto",
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  logoutBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffebee",
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e53935",
  },
  versionSubText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
