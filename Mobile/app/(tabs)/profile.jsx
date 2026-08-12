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
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { Image } from "expo-image";
import { sleep } from "../../lib/utils";
import Loader from "../../components/Loader";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

import { useAlert } from "../../context/AlertContext";

export default function Profile() {
  const { showAlert } = useAlert();
  const [books, setBooks] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState(null);

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
        allowsEditing: false,
        quality: 0.7,
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
      <Image source={{ uri: item.image }} style={styles.bookImage} contentFit="cover" />
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

      <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item._id)}>
        {deleteBookId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
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
              onLogoutPress={logout}
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
    </View>
  );
}