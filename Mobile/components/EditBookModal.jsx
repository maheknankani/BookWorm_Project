import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";
import { useAlert } from "../context/AlertContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import ImageCropModal from "./ImageCropModal";

export default function EditBookModal({
  visible,
  book,
  onClose,
  onBookUpdated,
}) {
  const { token } = useAuthStore();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [pdfName, setPdfName] = useState(null);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);

  useEffect(() => {
    if (visible && book) {
      setTitle(book.title || "");
      setCaption(book.caption || "");
      setRating(book.rating || 3);
      setImageUri(book.image || null);
      setImageBase64(null);
      setPdfName(book.pdfUrl ? "Existing PDF attached" : null);
      setPdfDataUrl(book.pdfUrl || null);
    }
  }, [visible, book]);

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showAlert({ title: "Permission Denied", message: "Photo library permissions are required to change cover image", type: "error" });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images || "images",
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        if (asset.base64) {
          setImageBase64(asset.base64);
        } else {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(base64);
        }
      }
    } catch (err) {
      console.error("Error picking image:", err);
      showAlert({ title: "Error", message: "Failed to select image", type: "error" });
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setPdfName(file.name);
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setPdfDataUrl(`data:application/pdf;base64,${base64}`);
      }
    } catch (err) {
      console.error("Error picking document:", err);
    }
  };

  const handleSave = async () => {
    const bookId = book?._id || book?.id;
    if (!bookId) {
      showAlert({ title: "Error", message: "Invalid recommendation ID", type: "error" });
      return;
    }

    if (!title.trim()) {
      showAlert({ title: "Error", message: "Title cannot be empty", type: "error" });
      return;
    }
    if (!caption.trim()) {
      showAlert({ title: "Error", message: "Review caption cannot be empty", type: "error" });
      return;
    }

    try {
      setLoading(true);

      const reqBody = {
        title: title.trim(),
        caption: caption.trim(),
        rating: rating.toString(),
      };

      if (imageBase64) {
        const uriParts = imageUri ? imageUri.split(".") : [];
        const fileType = uriParts.length > 0 ? uriParts[uriParts.length - 1] : "jpeg";
        const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";
        reqBody.image = `data:${imageType};base64,${imageBase64}`;
      } else if (book?.image) {
        reqBody.image = book.image;
      }

      if (pdfDataUrl && pdfDataUrl.startsWith("data:")) {
        reqBody.pdf = pdfDataUrl;
      } else if (book?.pdfUrl) {
        reqBody.pdf = book.pdfUrl;
      }

      let response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      // Fallback if network proxy or server router rejects PUT method
      if (response.status === 404 || response.status === 405) {
        response = await fetch(`${API_URL}/books/${bookId}/edit`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqBody),
        });
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const responseText = await response.text();
        console.error("Non-JSON server response:", responseText);
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data?.message || `Server error (${response.status})`);
      }

      showAlert({ title: "Success 🎉", message: "Recommendation updated successfully!", type: "success" });
      if (onBookUpdated) onBookUpdated(data);
      onClose();
    } catch (err) {
      console.error("Error updating book:", err);
      showAlert({ title: "Error", message: err.message || "Failed to update recommendation", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !book) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* HEADER BAR */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Recommendation</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollForm} showsVerticalScrollIndicator={false}>
            {/* BOOK TITLE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter book title"
                placeholderTextColor={COLORS.placeholderText}
              />
            </View>

            {/* RATING */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity key={i} onPress={() => setRating(i)} style={{ padding: 4 }}>
                    <Ionicons
                      name={i <= rating ? "star" : "star-outline"}
                      size={28}
                      color={i <= rating ? "#f4b400" : COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* COVER IMAGE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cover Image</Text>
              <TouchableOpacity style={styles.imageBox} onPress={pickImage} activeOpacity={0.85}>
                <Image source={{ uri: imageUri }} style={styles.coverPreview} contentFit="contain" />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.changeImageText}>Change Cover</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* PDF UPLOAD */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>PDF / e-Book (Optional)</Text>
              <TouchableOpacity style={styles.pdfBox} onPress={pickPdf}>
                <Ionicons name="document-text-outline" size={22} color={pdfName ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 10 }} />
                <Text style={styles.pdfText} numberOfLines={1}>
                  {pdfName || "Attach PDF e-Book"}
                </Text>
                {pdfName ? (
                  <TouchableOpacity onPress={() => { setPdfName(null); setPdfDataUrl(null); }}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>

            {/* CAPTION */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption / Review</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                value={caption}
                onChangeText={setCaption}
                multiline
                placeholder="Write your review..."
                placeholderTextColor={COLORS.placeholderText}
              />
            </View>
          </ScrollView>

          {/* ACTION BUTTONS */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollForm: {
    paddingBottom: 10,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  imageBox: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  coverPreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  pdfBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  pdfText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  saveText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
});
