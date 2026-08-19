import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../constants/api";
import COLORS from "../constants/colors";
import Loader from "../components/Loader";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Notifications() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch notifications");

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      setNotifications((prev) => prev.filter((n) => n._id !== id));

      await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) return;

    Alert.alert(
      "Delete All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              setNotifications([]);
              await fetch(`${API_URL}/notifications`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
            } catch (error) {
              console.error("Error deleting all notifications:", error);
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (item) => {
    try {
      if (!item.isRead) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );

        await fetch(`${API_URL}/notifications/${item._id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (item.book) {
        const bookId = typeof item.book === "object" ? item.book._id : item.book;
        if (bookId) router.push(`/book/${bookId}`);
      }
    } catch (error) {
      console.error("Error navigating notification:", error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderItem = ({ item }) => {
    const sender = item.sender || {};
    const book = item.book || {};
    const type = item.type;

    let iconName = "heart";
    let iconColor = "#e53935";
    let badgeBg = "#ffebee";
    let textContent = "";

    if (type === "like") {
      iconName = "heart";
      iconColor = "#e53935";
      badgeBg = "#ffebee";
      textContent = `liked your recommendation "${book.title || "your book"}"`;
    } else if (type === "comment") {
      iconName = "chatbubble";
      iconColor = COLORS.primary;
      badgeBg = "#eef7ee";
      textContent = `commented on "${book.title || "your book"}"`;
    }

    return (
      <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
        <TouchableOpacity
          style={styles.cardMainContent}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          {/* SENDER AVATAR & TYPE BADGE */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: sender.profileImage || "https://res.cloudinary.com/dytv9l0px/image/upload/v1727788480/user_pfp_placeholder.png",
              }}
              style={styles.avatar}
            />
            <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
              <Ionicons name={iconName} size={10} color={iconColor} />
            </View>
          </View>

          {/* CONTENT */}
          <View style={styles.contentContainer}>
            <Text style={styles.messageText}>
              <Text style={styles.usernameText}>{sender.username || "Someone"} </Text>
              {textContent}
            </Text>

            {item.commentText ? (
              <Text style={styles.commentSnippet} numberOfLines={1}>
                "{item.commentText}"
              </Text>
            ) : null}

            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
          </View>

          {/* UNREAD DOT OR BOOK COVER */}
          <View style={styles.rightSection}>
            {book.image ? (
              <Image source={{ uri: book.image }} style={styles.bookThumb} contentFit="cover" />
            ) : null}
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>

        {/* DELETE BUTTON */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item._id)}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#e53935" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) return <Loader />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* TOP HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Notifications</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadButton}>
            <Text style={styles.markReadText}>Read All</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllButton}>
            <Ionicons name="trash-outline" size={20} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>

      {/* NOTIFICATIONS LIST */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications(false);
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptySubtitle}>
              When someone likes or comments on your book recommendations, you'll see it here!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markReadButton: {
    padding: 4,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  deleteAllButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardMainContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCard: {
    backgroundColor: "#f0f7ff",
    borderColor: COLORS.primary,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1.5,
    borderColor: COLORS.cardBackground,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  usernameText: {
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  bookTitleText: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  commentSnippet: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bookThumb: {
    width: 34,
    height: 48,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
