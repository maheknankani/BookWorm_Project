import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../../assets/styles/library.styles";
import Loader from "../../components/Loader";

import { useAlert } from "../../context/AlertContext";

const CATEGORIES = [
  { key: "want_to_read", label: "Want to Read", icon: "bookmark-outline" },
  { key: "reading", label: "Reading", icon: "book-outline" },
  { key: "finished", label: "Finished", icon: "checkmark-done-circle-outline" },
];

export default function Library() {
  const { showAlert } = useAlert();
  const { token } = useAuthStore();
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState("want_to_read");
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for changing status
  const [selectedBookItem, setSelectedBookItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLibrary = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch(`${API_URL}/library?status=${activeCategory}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch library");

      setLibraryItems(data);
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchLibrary();
  }, [token, activeCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLibrary(false);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedBookItem) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/library`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: selectedBookItem.book._id,
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update status");

      setModalVisible(false);
      setSelectedBookItem(null);
      fetchLibrary(false);
    } catch (error) {
      showAlert({ title: "Error", message: error.message || "Failed to update status", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItem = async (bookId) => {
    showAlert({
      title: "Remove Book",
      message: "Are you sure you want to remove this book from your library?",
      type: "confirm",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/library/${bookId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!response.ok) throw new Error("Failed to remove item");

              setLibraryItems((prev) => prev.filter((item) => item.book._id !== bookId));
              if (modalVisible) setModalVisible(false);
            } catch (error) {
              showAlert({ title: "Error", message: error.message || "Failed to remove book", type: "error" });
            }
          },
        },
      ],
    });
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const renderBookCard = ({ item }) => {
    const book = item.book;
    if (!book) return null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/book/${book._id}`)}
      >
        <Image source={{ uri: book.image }} style={styles.bookImage} contentFit="cover" />

        <View style={styles.infoContainer}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <View style={styles.ratingContainer}>{renderRatingStars(book.rating)}</View>
          <Text style={styles.userText}>Shared by {book.user?.username || "Community"}</Text>

          {/* PROGRESS OR STATUS BADGE */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {CATEGORIES.find((c) => c.key === item.status)?.label || "Saved"}
              </Text>
            </View>

            {item.lastPageRead ? (
              <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: "500" }}>
                Page {item.lastPageRead} of {item.totalPages || 100}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.statusPickerButton}
            onPress={() => {
              setSelectedBookItem(item);
              setModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(book._id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) return <Loader />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library 📖</Text>
        <Text style={styles.headerSubtitle}>Track your personal reading list & progress</Text>
      </View>

      {/* CATEGORY TAB SELECTOR */}
      <View style={styles.categoryContainer}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryTab,
                isActive && styles.categoryTabActive,
                { flexDirection: "row", alignItems: "center", gap: 4 },
              ]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={isActive ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SAVED BOOKS LIST */}
      <FlatList
        data={libraryItems}
        renderItem={renderBookCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={56} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No books in this category</Text>
            <Text style={styles.emptySubtext}>
              Save books from the Home Feed to track your reading progress!
            </Text>
          </View>
        }
      />

      {/* STATUS CHANGE MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Reading Status</Text>

            {CATEGORIES.map((cat) => {
              const isSelected = selectedBookItem?.status === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                  disabled={actionLoading}
                  onPress={() => handleUpdateStatus(cat.key)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}

            {actionLoading ? (
              <ActivityIndicator style={{ marginVertical: 10 }} color={COLORS.primary} />
            ) : (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
