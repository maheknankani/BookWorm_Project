import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

export default function CreateStoryModal({
  visible,
  onClose,
  initialBookTitle = "",
  initialBookCover = "",
  initialBookId = null,
  initialQuote = "",
  initialPageNumber = "",
  onStoryCreated,
}) {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState("media"); // "media" | "quote"
  const [selectedMedia, setSelectedMedia] = useState(null); // { uri, type: 'image'|'video', base64 }
  const [caption, setCaption] = useState("");
  const [bookTitle, setBookTitle] = useState(initialBookTitle);
  const [bookCover, setBookCover] = useState(initialBookCover);
  const [quote, setQuote] = useState(initialQuote);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (visible) {
      setBookTitle(initialBookTitle || "");
      setBookCover(initialBookCover || "");
      setQuote(initialQuote || "");
      setPageNumber(initialPageNumber || "");
      setSelectedMedia(null);
      setCaption("");
      setActiveTab(initialQuote ? "quote" : "media");
    }
  }, [visible, initialBookTitle, initialBookCover, initialQuote, initialPageNumber]);

  // Pick media from Gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant access to your photo library to pick media.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === "video";
        const base64Data = asset.base64
          ? `data:${isVideo ? "video/mp4" : "image/jpeg"};base64,${asset.base64}`
          : asset.uri;

        setSelectedMedia({
          uri: asset.uri,
          type: isVideo ? "video" : "image",
          base64: base64Data,
        });
      }
    } catch (err) {
      console.error("Pick media error:", err);
      Alert.alert("Error", "Could not load media from gallery.");
    }
  };

  // Capture from Camera
  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant camera permission to capture a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === "video";
        const base64Data = asset.base64
          ? `data:${isVideo ? "video/mp4" : "image/jpeg"};base64,${asset.base64}`
          : asset.uri;

        setSelectedMedia({
          uri: asset.uri,
          type: isVideo ? "video" : "image",
          base64: base64Data,
        });
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Error", "Could not capture camera media.");
    }
  };

  const handlePublish = async () => {
    if (activeTab === "media" && !selectedMedia) {
      Alert.alert("Media Required", "Please select a photo or video from your gallery/camera, or switch to Quote story.");
      return;
    }
    if (activeTab === "quote" && !quote.trim()) {
      Alert.alert("Quote Required", "Please enter a book quote or excerpt.");
      return;
    }

    try {
      setPublishing(true);
      const payload = {
        media: selectedMedia ? selectedMedia.base64 : "",
        mediaType: selectedMedia ? selectedMedia.type : "quote",
        caption: caption.trim(),
        bookId: initialBookId || null,
        bookTitle: bookTitle.trim(),
        bookCover: bookCover.trim(),
        quote: quote.trim(),
        pageNumber: pageNumber.trim(),
      };

      const response = await fetch(`${API_URL}/stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to publish story.");
      }

      Alert.alert("Story Posted! 📸", "Your Instagram story has been shared to your community.");
      if (onStoryCreated) onStoryCreated(data.story);
      onClose();
    } catch (error) {
      console.error("Publish story error:", error);
      Alert.alert("Error", error.message || "Could not publish story.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Story</Text>
            <TouchableOpacity
              onPress={handlePublish}
              disabled={publishing}
              style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
            >
              {publishing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.publishBtnText}>Post Story</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* TAB MODE SWITCHER */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "media" && styles.activeTabBtn]}
              onPress={() => setActiveTab("media")}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={activeTab === "media" ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === "media" && styles.activeTabText]}>
                Photo / Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "quote" && styles.activeTabBtn]}
              onPress={() => setActiveTab("quote")}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color={activeTab === "quote" ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === "quote" && styles.activeTabText]}>
                Book Quote
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === "media" ? (
              <View>
                {/* MEDIA SELECTION AREA */}
                {selectedMedia ? (
                  <View style={styles.mediaPreviewContainer}>
                    <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreview} />
                    <TouchableOpacity
                      style={styles.changeMediaBtn}
                      onPress={() => setSelectedMedia(null)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ffffff" />
                      <Text style={{ color: "#ffffff", fontWeight: "700", marginLeft: 4 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.pickButtonsRow}>
                    <TouchableOpacity style={styles.pickCard} onPress={handlePickFromGallery}>
                      <Ionicons name="images-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.pickCardText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pickCard} onPress={handleLaunchCamera}>
                      <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                      <Text style={styles.pickCardText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* OVERLAY TEXT INPUT */}
                <Text style={styles.label}>Add Story Text Overlay</Text>
                <TextInput
                  style={styles.input}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Type a message or text overlay for your story..."
                  placeholderTextColor={COLORS.placeholderText}
                  multiline
                />
              </View>
            ) : (
              <View>
                <Text style={styles.label}>Book Title</Text>
                <TextInput
                  style={styles.input}
                  value={bookTitle}
                  onChangeText={setBookTitle}
                  placeholder="e.g. Atomic Habits"
                  placeholderTextColor={COLORS.placeholderText}
                />

                <Text style={styles.label}>Highlighted Quote / Excerpt *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={quote}
                  onChangeText={setQuote}
                  multiline
                  numberOfLines={4}
                  placeholder="Paste or type the quote text..."
                  placeholderTextColor={COLORS.placeholderText}
                />

                <Text style={styles.label}>Page Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={pageNumber}
                  onChangeText={setPageNumber}
                  placeholder="e.g. 142"
                  placeholderTextColor={COLORS.placeholderText}
                />
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  publishBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  activeTabBtn: {
    borderColor: COLORS.primary,
    backgroundColor: "#e8f5e9",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  body: {
    padding: 18,
  },
  pickButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 10,
  },
  pickCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  pickCardText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  mediaPreviewContainer: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  changeMediaBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});
