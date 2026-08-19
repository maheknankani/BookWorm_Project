import { useEffect, useState } from "react";
import {
  View,
  Alert,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { Image } from "expo-image";
import Loader from "../../components/Loader";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { sleep } from "../../lib/utils";

import { useAlert } from "../../context/AlertContext";
import ImageViewerModal from "../../components/ImageViewerModal";
import EditBookModal from "../../components/EditBookModal";

export default function Profile() {
  const { showAlert } = useAlert();
  const params = useLocalSearchParams();
  const [books, setBooks] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState(null);

  // Edit Book Recommendation State
  const [editBookModalVisible, setEditBookModalVisible] = useState(false);
  const [selectedEditBook, setSelectedEditBook] = useState(null);

  // Full Screen Profile Image Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImageUri, setViewerImageUri] = useState(null);
  const [viewerTitle, setViewerTitle] = useState("");

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editFavoriteGenre, setEditFavoriteGenre] = useState("");
  const [editReadingGoal, setEditReadingGoal] = useState("");
  const [newAvatarUri, setNewAvatarUri] = useState(null);
  const [newAvatarBase64, setNewAvatarBase64] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const { token, user, updateUser, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (params?.edit === "true" && user) {
      setEditUsername(user.username || "");
      setEditBio(user.bio || "");
      setEditFavoriteGenre(user.favoriteGenre || "");
      setEditReadingGoal(user.readingGoal ? String(user.readingGoal) : "");
      setNewAvatarUri(null);
      setNewAvatarBase64(null);
      setEditModalVisible(true);
    }
  }, [params?.edit, user]);

  const openAvatarViewer = () => {
    const uri =
      user?.profileImage ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;
    setViewerImageUri(uri);
    setViewerTitle(user?.username || "Profile Picture");
    setViewerVisible(true);
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);

      const booksRes = await fetch(`${API_URL}/books/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const booksData = await booksRes.json();
      if (booksRes.ok) setBooks(booksData);

      const libraryRes = await fetch(`${API_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const libraryData = await libraryRes.json();
      if (libraryRes.ok) setSavedCount(libraryData.length || 0);

    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfileData();
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(400);
    await fetchProfileData();
  };

  const handleDeleteBook = async (bookId) => {
    try {
      setDeleteBookId(bookId);

      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete book");

      setBooks(books.filter((book) => book._id !== bookId));
      showAlert({ title: "Success", message: "Recommendation deleted successfully", type: "success" });
    } catch (error) {
      showAlert({ title: "Error", message: error.message || "Failed to delete recommendation", type: "error" });
    } finally {
      setDeleteBookId(null);
    }
  };

  const confirmDelete = (bookId) => {
    showAlert({
      title: "Delete Recommendation",
      message: "Are you sure you want to delete this recommendation?",
      type: "confirm",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDeleteBook(bookId) },
      ],
    });
  };

  // Open Edit Profile Modal
  const openEditModal = () => {
    setEditUsername(user?.username || "");
    setEditBio(user?.bio || "");
    setEditFavoriteGenre(user?.favoriteGenre || "");
    setEditReadingGoal(user?.readingGoal || "");
    setNewAvatarUri(null);
    setNewAvatarBase64(null);
    setEditModalVisible(true);
  };

  // Pick Avatar Image
  const pickNewAvatar = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showAlert({ title: "Permission Denied", message: "We need camera roll permissions to change your avatar", type: "error" });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images || "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setNewAvatarUri(result.assets[0].uri);
        if (result.assets[0].base64) {
          setNewAvatarBase64(result.assets[0].base64);
        } else {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setNewAvatarBase64(base64);
        }
      }
    } catch (err) {
      console.error("Error picking avatar:", err);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      showAlert({ title: "Error", message: "Username cannot be empty", type: "error" });
      return;
    }

    try {
      setUpdateLoading(true);

      let profileImagePayload = "";
      if (newAvatarBase64) {
        profileImagePayload = `data:image/jpeg;base64,${newAvatarBase64}`;
      } else if (newAvatarUri) {
        profileImagePayload = newAvatarUri;
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername.trim(),
          profileImage: profileImagePayload,
          bio: editBio,
          favoriteGenre: editFavoriteGenre,
          readingGoal: editReadingGoal,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update profile");

      updateUser(data.user);
      setEditModalVisible(false);
      showAlert({ title: "Success 🎉", message: "Profile updated successfully!", type: "success" });
    } catch (error) {
      showAlert({ title: "Error", message: error.message || "Could not update profile", type: "error" });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Compute dynamic average rating
  const avgRating =
    books.length > 0
      ? (books.reduce((sum, b) => sum + (b.rating || 0), 0) / books.length).toFixed(1)
      : "0.0";

  const renderBookItem = ({ item }) => (
    <View style={styles.bookItem}>
      <TouchableOpacity
        onPress={() => {
          setViewerImageUri(item.image);
          setViewerTitle(item.title);
          setViewerVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.image }} style={styles.bookImage} contentFit="contain" />
      </TouchableOpacity>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
        <Text style={styles.bookCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <Text style={styles.bookDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            setSelectedEditBook(item);
            setEditBookModalVisible(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item._id)}>
          {deleteBookId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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

  if (isLoading && !refreshing) return <Loader />;

  const handleLogout = () => {
    showAlert({
      title: "Logout",
      message: "Are you sure you want to log out of BookWorm?",
      type: "confirm",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)");
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.booksList}
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* REDESIGNED PROFILE HEADER WITH DYNAMIC STATS & EXTRA DETAILS */}
            <ProfileHeader
              booksSharedCount={books.length}
              booksSavedCount={savedCount}
              avgRating={avgRating}
              onEditPress={openEditModal}
              onLogoutPress={handleLogout}
              onAvatarPress={openAvatarViewer}
            />

            {/* MY RECOMMENDATIONS HEADER */}
            <View style={styles.booksHeader}>
              <Text style={styles.booksTitle}>My Recommendations 📚</Text>
              <Text style={styles.booksCount}>{books.length} books</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={50} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
              <Text style={styles.addButtonText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: "center", minHeight: "100%", paddingVertical: 20 }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              {/* AVATAR SELECTION */}
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <TouchableOpacity onPress={pickNewAvatar} style={{ position: "relative" }}>
                  <Image
                    source={{
                      uri:
                        newAvatarUri ||
                        user?.profileImage ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`,
                    }}
                    style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: COLORS.primary }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      backgroundColor: COLORS.primary,
                      borderRadius: 12,
                      padding: 6,
                    }}
                  >
                    <Ionicons name="camera" size={14} color={COLORS.white} />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>
                  Tap to change picture
                </Text>
                {newAvatarUri ? (
                  <TouchableOpacity
                    onPress={() => {
                      setNewAvatarUri(null);
                      setNewAvatarBase64(null);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, backgroundColor: "#fee2e2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                  >
                    <Ionicons name="trash-outline" size={12} color="#dc2626" />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#dc2626" }}>Remove Selected Photo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* USERNAME INPUT */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter username"
                  placeholderTextColor={COLORS.placeholderText}
                  value={editUsername}
                  onChangeText={setEditUsername}
                />
              </View>

              {/* BIO / ABOUT ME */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio / About Me</Text>
                <TextInput
                  style={[styles.modalInput, { height: 70, textAlignVertical: "top" }]}
                  placeholder="Tell others about your reading passion..."
                  placeholderTextColor={COLORS.placeholderText}
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                />
              </View>

              {/* FAVORITE GENRE */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Favorite Genre</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Fantasy, Mystery, Sci-Fi"
                  placeholderTextColor={COLORS.placeholderText}
                  value={editFavoriteGenre}
                  onChangeText={setEditFavoriteGenre}
                />
              </View>

              {/* READING GOAL */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reading Goal</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 24 Books in 2026"
                  placeholderTextColor={COLORS.placeholderText}
                  value={editReadingGoal}
                  onChangeText={setEditReadingGoal}
                />
              </View>

              {/* MODAL ACTION BUTTONS */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setEditModalVisible(false)}
                  disabled={updateLoading}
                >
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton]}
                  onPress={handleSaveProfile}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveModalText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* EDIT BOOK RECOMMENDATION MODAL */}
      <EditBookModal
        visible={editBookModalVisible}
        book={selectedEditBook}
        onClose={() => setEditBookModalVisible(false)}
        onBookUpdated={() => fetchProfileData()}
      />

      {/* FULL SCREEN PROFILE IMAGE VIEWER MODAL */}
      <ImageViewerModal
        visible={viewerVisible}
        imageUri={viewerImageUri}
        title={viewerTitle}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}