import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

export default function CreateStoryModal({
  visible,
  onClose,
  onStoryCreated,
}) {
  const { token } = useAuthStore();
  const [selectedMedia, setSelectedMedia] = useState(null); // { uri, type: 'image'|'video', base64 }
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedMedia(null);
      setCaption("");
    }
  }, [visible]);

  // Pick media from Gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant access to your photo library to pick media.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          type: "image",
          base64: asset.base64,
        });
      }
    } catch (err) {
      console.error("Gallery picker error:", err);
    }
  };

  // Capture from Camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant camera permission to take a story photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          type: "image",
          base64: asset.base64,
        });
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  // Submit Story to Backend
  const handlePublishStory = async () => {
    if (!selectedMedia) {
      Alert.alert("Photo Required", "Please select a photo from your gallery or take one with camera.");
      return;
    }

    try {
      setPublishing(true);

      let mediaPayload = "";
      if (selectedMedia?.base64) {
        mediaPayload = `data:image/jpeg;base64,${selectedMedia.base64}`;
      } else if (selectedMedia?.uri) {
        mediaPayload = selectedMedia.uri;
      }

      const response = await fetch(`${API_URL}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaUrl: mediaPayload,
          mediaType: "image",
          caption: caption.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || "Failed to post story");
      }

      if (onStoryCreated) onStoryCreated();
      onClose();
    } catch (err) {
      console.error("Publish story error:", err);
      Alert.alert("Error", err.message || "Failed to publish story.");
    } finally {
      setPublishing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

        <View style={styles.modalContent}>
          {/* HEADER ROW */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add to your Story</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* PREVIEW OR PICKER OPTIONS */}
          {selectedMedia ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} resizeMode="cover" />

              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption..."
                placeholderTextColor={COLORS.textSecondary}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.changeMediaBtn}
                  onPress={() => setSelectedMedia(null)}
                >
                  <Text style={styles.changeMediaText}>Retake / Pick Another</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handlePublishStory}
                  disabled={publishing}
                >
                  {publishing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.shareBtnText}>Share Story 🚀</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.pickerOptionsContainer}>
              {/* TAKE PHOTO WITH CAMERA */}
              <TouchableOpacity style={styles.optionCard} onPress={handleTakePhoto} activeOpacity={0.8}>
                <View style={[styles.iconCircle, { backgroundColor: "#e0f2fe" }]}>
                  <Ionicons name="camera" size={32} color="#0284c7" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Camera</Text>
                  <Text style={styles.optionSubtitle}>Take a photo with your device camera</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {/* CHOOSE FROM GALLERY */}
              <TouchableOpacity style={styles.optionCard} onPress={handlePickFromGallery} activeOpacity={0.8}>
                <View style={[styles.iconCircle, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="images" size={32} color="#16a34a" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Photo Gallery</Text>
                  <Text style={styles.optionSubtitle}>Choose an existing image from your library</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 320,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  pickerOptionsContainer: {
    gap: 14,
    paddingBottom: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  previewContainer: {
    alignItems: "center",
    paddingBottom: 10,
  },
  previewImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    marginBottom: 14,
  },
  captionInput: {
    width: "100%",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  changeMediaBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    alignItems: "center",
  },
  changeMediaText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});
