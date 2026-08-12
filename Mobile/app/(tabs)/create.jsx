import { useState } from "react";
import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import styles from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { API_URL } from "../../constants/api";

import { useAlert } from "../../context/AlertContext";

export default function Create() {
  const { showAlert } = useAlert();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [pdfName, setPdfName] = useState(null);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showAlert({ title: "Permission Denied", message: "We need camera roll permissions to upload an image", type: "error" });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images || "images",
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        let fileSize = asset.fileSize || asset.size;
        if (!fileSize) {
          try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            fileSize = info.size;
          } catch {
            fileSize = 0;
          }
        }
        if (fileSize && fileSize > 5 * 1024 * 1024) {
          showAlert({ title: "File Too Large", message: "Cover image file size exceeds the 5MB limit. Please choose a smaller image.", type: "error" });
          return;
        }

        setImage(asset.uri);

        if (asset.base64) {
          setImageBase64(asset.base64);
        } else {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showAlert({ title: "Error", message: "There was a problem selecting your image", type: "error" });
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
        if (file.size && file.size > 10 * 1024 * 1024) {
          showAlert({ title: "File Too Large", message: "PDF document size exceeds the 10MB limit. Please choose a smaller file.", type: "error" });
          return;
        }

        setPdfName(file.name);

        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const dataUrl = `data:application/pdf;base64,${base64}`;
        setPdfDataUrl(dataUrl);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showAlert({ title: "Error", message: "Could not select PDF file", type: "error" });
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64 || !rating) {
      showAlert({ title: "Missing Information", message: "Please fill in title, caption, rating, and cover image", type: "info" });
      return;
    }

    try {
      setLoading(true);

      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";
      const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          caption,
          rating: rating.toString(),
          image: imageDataUrl,
          pdf: pdfDataUrl || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      showAlert({
        title: "Success! 🎉",
        message: "Your book recommendation and e-book have been posted!",
        type: "success",
        buttons: [{ text: "Awesome", onPress: () => router.push("/") }],
      });

      setTitle("");
      setCaption("");
      setRating(3);
      setImage(null);
      setImageBase64(null);
      setPdfName(null);
      setPdfDataUrl(null);
    } catch (error) {
      console.error("Error creating post:", error);
      showAlert({ title: "Upload Failed", message: error.message || "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Book Recommendation</Text>
            <Text style={styles.subtitle}>Share your favorite reads & e-books with others</Text>
          </View>

          <View style={styles.form}>
            {/* BOOK TITLE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter book title"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* RATING */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Rating</Text>
              {renderRatingPicker()}
            </View>

            {/* IMAGE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Cover Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
                {image ? (
                  <View style={{ width: "100%", height: "100%", position: "relative" }}>
                    <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <View style={styles.cropBadge}>
                        <Ionicons name="crop-outline" size={14} color="#ffffff" />
                        <Text style={styles.cropBadgeText}>Tap to Recrop</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.placeholderText}>Tap to select & crop cover image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* PDF UPLOAD */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>PDF / e-Book (Optional)</Text>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: COLORS.inputBackground,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  padding: 14,
                }}
                onPress={pickPdf}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={pdfName ? COLORS.primary : COLORS.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: pdfName ? COLORS.textDark : COLORS.placeholderText,
                      fontWeight: pdfName ? "600" : "400",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {pdfName || "Tap to select PDF file"}
                  </Text>
                </View>
                {pdfName ? (
                  <TouchableOpacity
                    onPress={() => {
                      setPdfName(null);
                      setPdfDataUrl(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="attach-outline" size={20} color={COLORS.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* CAPTION */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color={COLORS.primary} />
                <Text style={[styles.label, { marginBottom: 0 }]}>Caption / Review</Text>
              </View>
              <TextInput
                style={styles.textArea}
                placeholder="Write your review or thoughts about this book..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Share Recommendation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}