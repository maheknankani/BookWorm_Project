import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "expo-router";

import { Image } from "expo-image";
import { useEffect, useState } from "react";

import styles from "../../assets/styles/home.styles";
import { API_URL } from "../../constants/api";
import { Ionicons } from "@expo/vector-icons";
import { formatPublishDate, sleep } from "../../lib/utils";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";
import { SafeAreaView } from "react-native-safe-area-context";

const LIBRARY_CATEGORIES = [
  { key: "want_to_read", label: "Want to Read" },
  { key: "reading", label: "Currently Reading" },
  { key: "finished", label: "Finished" },
];

export default function Home() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [books, setBooks] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);

  // Notifications & Library status state
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [libraryStatusMap, setLibraryStatusMap] = useState({});
  const [selectedBookForLibrary, setSelectedBookForLibrary] = useState(null);
  const [libraryModalVisible, setLibraryModalVisible] = useState(false);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUnreadNotificationsCount = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.log("Error fetching unread notifications count", error);
    }
  };

  const fetchLibraryStatusMap = async () => {
    try {
      const response = await fetch(`${API_URL}/library/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const map = await response.json();
        setLibraryStatusMap(map);
      }
    } catch (error) {
      console.log("Error fetching library status map", error);
    }
  };

  const fetchBooks = async (pageNum = 1, refresh = false, search = debouncedSearch, rating = selectedRating) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1 && books.length === 0) {
        setInitialLoading(true);
      } else {
        setIsSearching(true);
      }

      let url = `${API_URL}/books?page=${pageNum}&limit=5`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (rating > 0) url += `&minRating=${rating}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Server did not return JSON:", text);
        throw new Error("Server returned non-JSON");
      }

      if (!response.ok) throw new Error(data.message || "Failed to fetch books");

      const fetchedBooks = data.books || [];

      const uniqueBooks =
        refresh || pageNum === 1
          ? fetchedBooks
          : Array.from(new Set([...books, ...fetchedBooks].map((book) => book._id))).map((id) =>
              [...books, ...fetchedBooks].find((book) => book._id === id)
            );

      setBooks(uniqueBooks);
      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log("Error fetching books", error);
    } finally {
      if (refresh) {
        await sleep(600);
        setRefreshing(false);
      }
      setInitialLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBooks(1, false, debouncedSearch, selectedRating);
      fetchLibraryStatusMap();
      fetchUnreadNotificationsCount();
    }
  }, [token, debouncedSearch, selectedRating]);

  const handleToggleLike = async (bookId) => {
    try {
      // Optimistic update
      setBooks((prev) =>
        prev.map((b) => {
          if (b._id === bookId) {
            const wasLiked = b.isLiked;
            return {
              ...b,
              isLiked: !wasLiked,
              likesCount: wasLiked ? b.likesCount - 1 : b.likesCount + 1,
            };
          }
          return b;
        })
      );

      const response = await fetch(`${API_URL}/books/${bookId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBooks((prev) =>
          prev.map((b) =>
            b._id === bookId ? { ...b, likesCount: data.likesCount, isLiked: data.isLiked } : b
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSaveToLibrary = async (bookId, status) => {
    try {
      const response = await fetch(`${API_URL}/library`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId, status }),
      });

      if (!response.ok) throw new Error("Failed to save to library");

      setLibraryStatusMap((prev) => ({ ...prev, [bookId]: status }));
      setLibraryModalVisible(false);
      setSelectedBookForLibrary(null);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update library status");
    }
  };

  const handleRemoveFromLibrary = async (bookId) => {
    try {
      const response = await fetch(`${API_URL}/library/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to remove from library");

      setLibraryStatusMap((prev) => {
        const newMap = { ...prev };
        delete newMap[bookId];
        return newMap;
      });
      setLibraryModalVisible(false);
      setSelectedBookForLibrary(null);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to remove from library");
    }
  };

  const handleLoadMore = async () => {
    if (hasMore && !initialLoading && !isSearching && !refreshing) {
      await fetchBooks(page + 1);
    }
  };

  const renderItem = ({ item }) => {
    const currentStatus = libraryStatusMap[item._id];

    return (
      <TouchableOpacity
        style={styles.bookCard}
        activeOpacity={0.9}
        onPress={() => router.push(`/book/${item._id}`)}
      >
        <View style={styles.bookHeader}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.user?.profileImage || "https://avatar.iran.liara.run/public" }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{item.user?.username || "Book Lover"}</Text>
          </View>

          {/* BOOKMARK BUTTON */}
          <TouchableOpacity
            onPress={() => {
              setSelectedBookForLibrary(item);
              setLibraryModalVisible(true);
            }}
            style={{ padding: 4 }}
          >
            <Ionicons
              name={currentStatus ? "bookmark" : "bookmark-outline"}
              size={22}
              color={currentStatus ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bookImageContainer}>
          <Image source={{ uri: item.image }} style={styles.bookImage} contentFit="cover" />
        </View>

        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
          <Text style={styles.caption} numberOfLines={3}>
            {item.caption}
          </Text>

          {/* LIKES & COMMENTS FOOTER ROW */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              {/* LIKE BUTTON */}
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                onPress={() => handleToggleLike(item._id)}
              >
                <Ionicons
                  name={item.isLiked ? "heart" : "heart-outline"}
                  size={18}
                  color={item.isLiked ? "#e53935" : COLORS.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: item.isLiked ? "#e53935" : COLORS.textSecondary,
                  }}
                >
                  {item.likesCount || 0}
                </Text>
              </TouchableOpacity>

              {/* COMMENTS COUNT */}
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                onPress={() => router.push(`/book/${item._id}`)}
              >
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.textSecondary }}>
                  {item.commentsCount || 0}
                </Text>
              </TouchableOpacity>

              {/* PDF BADGE IF AVAILABLE */}
              {item.pdfUrl ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    backgroundColor: COLORS.inputBackground,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Ionicons name="document-text" size={12} color={COLORS.primary} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: COLORS.primary }}>
                    e-Book
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.date}>{formatPublishDate(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  if (initialLoading && books.length === 0) return <Loader />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              fetchBooks(1, true);
              fetchLibraryStatusMap();
              fetchUnreadNotificationsCount();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.headerTitle}>BookWorm 🐛</Text>

              {/* NOTIFICATION BELL BUTTON */}
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={{ padding: 6, position: "relative" }}
              >
                <Ionicons name="notifications-outline" size={26} color={COLORS.textPrimary} />
                {unreadNotificationsCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "#e53935",
                      borderRadius: 10,
                      minWidth: 18,
                      height: 18,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 4,
                      borderWidth: 1.5,
                      borderColor: COLORS.background,
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: "700" }}>
                      {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.headerSubtitle}>
              Discover great reads & e-books from the community👇
            </Text>

            {/* SEARCH INPUT */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={COLORS.primary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search title or caption..."
                placeholderTextColor={COLORS.placeholderText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={styles.clearIcon} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearIcon}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* RATING FILTER CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              {[
                { label: "All", rating: 0, icon: "apps-outline" },
                { label: "5 Stars", rating: 5, icon: "star" },
                { label: "4+ Stars", rating: 4, icon: "star-half-outline" },
                { label: "3+ Stars", rating: 3, icon: "star-outline" },
              ].map((chip) => {
                const isActive = selectedRating === chip.rating;
                return (
                  <TouchableOpacity
                    key={chip.label}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      { flexDirection: "row", alignItems: "center", gap: 5 },
                    ]}
                    onPress={() => setSelectedRating(chip.rating)}
                  >
                    <Ionicons
                      name={chip.icon}
                      size={14}
                      color={isActive ? COLORS.white : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListFooterComponent={
          hasMore && books.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} size="small" color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No recommendations found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedRating > 0
                ? "Try adjusting your search query or rating filter."
                : "Be the first to share a book!"}
            </Text>
          </View>
        }
      />

      {/* QUICK BOOKMARK STATUS MODAL */}
      <Modal visible={libraryModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.cardBackground,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              borderTopWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: COLORS.textPrimary,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Save to My Library 📖
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {selectedBookForLibrary?.title}
            </Text>

            {LIBRARY_CATEGORIES.map((cat) => {
              const isSelected =
                selectedBookForLibrary &&
                libraryStatusMap[selectedBookForLibrary._id] === cat.key;

              return (
                <TouchableOpacity
                  key={cat.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: isSelected ? COLORS.background : COLORS.inputBackground,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: isSelected ? COLORS.primary : COLORS.border,
                  }}
                  onPress={() =>
                    handleSaveToLibrary(selectedBookForLibrary._id, cat.key)
                  }
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isSelected ? COLORS.primary : COLORS.textDark,
                    }}
                  >
                    {cat.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            {selectedBookForLibrary && libraryStatusMap[selectedBookForLibrary._id] && (
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  alignItems: "center",
                  borderRadius: 12,
                  backgroundColor: COLORS.inputBackground,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                onPress={() => handleRemoveFromLibrary(selectedBookForLibrary._id)}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#e53935" }}>
                  Remove from Library
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                paddingVertical: 14,
                alignItems: "center",
                borderRadius: 12,
                backgroundColor: COLORS.cardBackground,
              }}
              onPress={() => setLibraryModalVisible(false)}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.textSecondary }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
