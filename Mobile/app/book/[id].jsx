import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { formatPublishDate } from "../../lib/utils";
import Loader from "../../components/Loader";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAlert } from "../../context/AlertContext";
import CreateStoryModal from "../../components/CreateStoryModal";
import ImageViewerModal from "../../components/ImageViewerModal";
import EditBookModal from "../../components/EditBookModal";

const LIBRARY_STATUSES = [
  { key: "want_to_read", label: "Want to Read" },
  { key: "reading", label: "Currently Reading" },
  { key: "finished", label: "Finished" },
];

export default function BookDetails() {
  const { showAlert } = useAlert();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token, user: currentUser } = useAuthStore();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editBookModalVisible, setEditBookModalVisible] = useState(false);

  // Full Screen Image Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImageUri, setViewerImageUri] = useState(null);
  const [viewerTitle, setViewerTitle] = useState("");

  // Likes state
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Library & Reading Progress state
  const [libraryStatus, setLibraryStatus] = useState(null);
  const [lastPageRead, setLastPageRead] = useState(1);
  const [totalPages, setTotalPages] = useState(100);
  const [progressLoading, setProgressLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load book details");

      setBook(data);
      setLikesCount(data.likesCount || 0);
      setIsLiked(data.isLiked || false);
      setComments(data.comments || []);
    } catch (error) {
      console.error("Error fetching book details:", error);
      showAlert({ title: "Error", message: "Could not load book details", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchLibraryItem = async () => {
    try {
      const response = await fetch(`${API_URL}/library/item/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const item = await response.json();
        if (item) {
          setLibraryStatus(item.status);
          setLastPageRead(item.lastPageRead || 1);
          setTotalPages(item.totalPages || 100);
        }
      }
    } catch (error) {
      console.log("Error fetching library item info:", error);
    }
  };

  useEffect(() => {
    if (id && token) {
      fetchBookDetails();
      fetchLibraryItem();
    }
  }, [id, token]);

  const handleToggleLike = async () => {
    if (likeLoading) return;
    try {
      setLikeLoading(true);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

      const response = await fetch(`${API_URL}/books/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || commentLoading) return;

    try {
      setCommentLoading(true);
      const response = await fetch(`${API_URL}/books/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      const updatedComments = await response.json();
      if (!response.ok) throw new Error(updatedComments.message || "Failed to post comment");

      setComments(updatedComments);
      setCommentText("");
    } catch (error) {
      showAlert({ title: "Error", message: error.message || "Could not post comment", type: "error" });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    showAlert({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment?",
      type: "confirm",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/books/${id}/comment/${commentId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              const updatedComments = await response.json();
              if (!response.ok) throw new Error("Failed to delete comment");

              setComments(updatedComments);
            } catch (error) {
              showAlert({ title: "Error", message: error.message || "Could not delete comment", type: "error" });
            }
          },
        },
      ],
    });
  };

  const handleUpdateLibraryStatus = async (status) => {
    try {
      const response = await fetch(`${API_URL}/library`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: id, status }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      setLibraryStatus(status);
      setStatusModalVisible(false);
    } catch (error) {
      showAlert({ title: "Error", message: error.message || "Failed to update library status", type: "error" });
    }
  };

  const handleSaveReadingProgress = async () => {
    try {
      setProgressLoading(true);
      const response = await fetch(`${API_URL}/library/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: id,
          lastPageRead: Number(lastPageRead),
          totalPages: Number(totalPages),
        }),
      });

      if (!response.ok) throw new Error("Failed to save progress");
      showAlert({ title: "Progress Saved 📖", message: "Your reading progress has been updated!", type: "success" });
    } catch (error) {
      showAlert({ title: "Error", message: error.message || "Failed to save reading progress", type: "error" });
    } finally {
      setProgressLoading(false);
    }
  };

  const handleOpenPdf = () => {
    if (!book?.pdfUrl) {
      showAlert({ title: "No PDF Attached", message: "This book recommendation does not have a PDF file attached.", type: "info" });
      return;
    }
    router.push({
      pathname: "/book/pdf-viewer",
      params: { url: book.pdfUrl, title: book.title },
    });
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={18}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  if (loading || !book) return <Loader />;

  return (
    <SafeAreaView style={localStyles.container} edges={["top", "left", "right"]}>
      {/* HEADER NAV BAR */}
      <View style={localStyles.topBar}>
        <TouchableOpacity style={localStyles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={localStyles.topBarTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {currentUser && book.user?._id === currentUser.id && (
            <TouchableOpacity
              style={localStyles.bookmarkButton}
              onPress={() => setEditBookModalVisible(true)}
            >
              <Ionicons name="create-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={localStyles.bookmarkButton}
            onPress={() => setStatusModalVisible(true)}
          >
            <Ionicons
              name={libraryStatus ? "bookmark" : "bookmark-outline"}
              size={24}
              color={libraryStatus ? COLORS.primary : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* COVER & MAIN INFO */}
        <View style={localStyles.coverSection}>
          <TouchableOpacity
            onPress={() => {
              setViewerImageUri(book.image);
              setViewerTitle(book.title);
              setViewerVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Image source={{ uri: book.image }} style={localStyles.coverImage} contentFit="contain" />
          </TouchableOpacity>

          <View style={localStyles.mainInfo}>
            <Text style={localStyles.bookTitle}>{book.title}</Text>
            <View style={localStyles.ratingRow}>{renderRatingStars(book.rating)}</View>

            <View style={localStyles.authorRow}>
              <Image
                source={{ uri: book.user?.profileImage || "https://avatar.iran.liara.run/public" }}
                style={localStyles.authorAvatar}
              />
              <Text style={localStyles.authorName}>Posted by {book.user?.username}</Text>
            </View>

            <Text style={localStyles.publishDate}>Shared on {formatPublishDate(book.createdAt)}</Text>
          </View>
        </View>

        {/* ACTION BUTTONS: READ, LIKE & SHARE STORY */}
        <View style={localStyles.actionsRow}>
          <TouchableOpacity style={localStyles.readButton} onPress={handleOpenPdf}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
            <Text style={localStyles.readButtonText}>Read</Text>
          </TouchableOpacity>

          <TouchableOpacity style={localStyles.storyButton} onPress={() => setStoryModalVisible(true)}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
            <Text style={localStyles.storyButtonText}>Share Story</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.likeButton, isLiked && localStyles.likeButtonActive]}
            onPress={handleToggleLike}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={18}
              color={isLiked ? "#e53935" : COLORS.textPrimary}
            />
            <Text style={[localStyles.likeButtonText, isLiked && { color: "#e53935" }]}>
              {likesCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* READING PROGRESS & STATUS */}
        <View style={localStyles.progressCard}>
          <View style={localStyles.progressHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={localStyles.progressTitle}>Reading Progress</Text>
            </View>

            <TouchableOpacity
              style={localStyles.statusBadge}
              onPress={() => setStatusModalVisible(true)}
            >
              <Text style={localStyles.statusBadgeText}>
                {LIBRARY_STATUSES.find((s) => s.key === libraryStatus)?.label || "Add to Library"}
              </Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={localStyles.pageInputsRow}>
            <Text style={localStyles.pageLabel}>Last Page Read:</Text>
            <TextInput
              style={localStyles.pageInput}
              keyboardType="number-pad"
              value={String(lastPageRead)}
              onChangeText={(txt) => setLastPageRead(txt)}
            />
            <Text style={localStyles.pageLabel}>of</Text>
            <TextInput
              style={localStyles.pageInput}
              keyboardType="number-pad"
              value={String(totalPages)}
              onChangeText={(txt) => setTotalPages(txt)}
            />
            <TouchableOpacity
              style={localStyles.saveProgressButton}
              onPress={handleSaveReadingProgress}
              disabled={progressLoading}
            >
              {progressLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={localStyles.saveProgressText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* CAPTION / REVIEW */}
        <View style={localStyles.reviewCard}>
          <Text style={localStyles.sectionTitle}>Review & Thoughts</Text>
          <Text style={localStyles.reviewText}>{book.caption}</Text>
        </View>

        {/* COMMENTS SECTION */}
        <View style={localStyles.commentsCard}>
          <Text style={localStyles.sectionTitle}>
            Community Comments ({comments.length})
          </Text>

          {/* ADD COMMENT INPUT */}
          <View style={localStyles.commentInputRow}>
            <TextInput
              style={localStyles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.placeholderText}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              style={[
                localStyles.postCommentButton,
                !commentText.trim() && { opacity: 0.6 },
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || commentLoading}
            >
              {commentLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={localStyles.postCommentText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* COMMENTS LIST */}
          {comments.length === 0 ? (
            <Text style={localStyles.noCommentsText}>
              No comments yet. Be the first to join the conversation!
            </Text>
          ) : (
            comments.map((item) => {
              const isOwner =
                currentUser &&
                (item.user?._id === currentUser._id || item.user === currentUser._id);

              return (
                <View key={item._id || Math.random().toString()} style={localStyles.commentItem}>
                  <Image
                    source={{
                      uri: item.user?.profileImage || "https://avatar.iran.liara.run/public",
                    }}
                    style={localStyles.commentAvatar}
                  />
                  <View style={localStyles.commentBody}>
                    <View style={localStyles.commentMeta}>
                      <Text style={localStyles.commentAuthor}>
                        {item.user?.username || "Reader"}
                      </Text>
                      {isOwner && (
                        <TouchableOpacity onPress={() => handleDeleteComment(item._id)}>
                          <Ionicons name="trash-outline" size={16} color="#e53935" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={localStyles.commentContent}>{item.text}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* STATUS PICKER MODAL */}
      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Set Library Status</Text>

            {LIBRARY_STATUSES.map((status) => {
              const isSelected = libraryStatus === status.key;
              return (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    localStyles.modalOption,
                    isSelected && localStyles.modalOptionActive,
                  ]}
                  onPress={() => handleUpdateLibraryStatus(status.key)}
                >
                  <Text
                    style={[
                      localStyles.modalOptionText,
                      isSelected && localStyles.modalOptionTextActive,
                    ]}
                  >
                    {status.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={localStyles.modalCancel}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={localStyles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CreateStoryModal
        visible={storyModalVisible}
        onClose={() => setStoryModalVisible(false)}
        initialBookTitle={book?.title}
        initialBookCover={book?.image}
        initialBookId={book?._id}
        initialPageNumber={String(lastPageRead)}
      />

      <EditBookModal
        visible={editBookModalVisible}
        book={book}
        onClose={() => setEditBookModalVisible(false)}
        onBookUpdated={(updated) => setBook(updated)}
      />

      <ImageViewerModal
        visible={viewerVisible}
        imageUri={viewerImageUri}
        title={viewerTitle}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 6,
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginHorizontal: 12,
  },
  bookmarkButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  coverSection: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  coverImage: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  mainInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  publishDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  readButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  readButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  storyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1b4323",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  storyButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 6,
  },
  likeButtonActive: {
    borderColor: "#e53935",
    backgroundColor: "#ffebee",
  },
  likeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  progressCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  pageInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  pageInput: {
    width: 54,
    height: 38,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.textDark,
  },
  saveProgressButton: {
    marginLeft: "auto",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveProgressText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 13,
  },
  reviewCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textDark,
  },
  commentsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentInputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
  },
  postCommentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  postCommentText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  noCommentsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 12,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  commentContent: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  modalOptionTextActive: {
    color: COLORS.primary,
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});
