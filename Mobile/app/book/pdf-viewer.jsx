import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useState } from "react";
import CreateStoryModal from "../../components/CreateStoryModal";

export default function PdfViewer() {
  const { url, title } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storyModalVisible, setStoryModalVisible] = useState(false);

  // Use Google Docs PDF viewer URL for universal Android/iOS PDF rendering
  const viewerUrl = url
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {title || "PDF Reader"}
        </Text>
        <TouchableOpacity
          style={styles.storyBtn}
          onPress={() => setStoryModalVisible(true)}
        >
          <Ionicons name="sparkles" size={18} color="#ffffff" />
          <Text style={styles.storyBtnText}>Quote Story</Text>
        </TouchableOpacity>
      </View>

      {url ? (
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: viewerUrl }}
            style={{ flex: 1 }}
            onLoadEnd={() => setLoading(false)}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Opening e-Book...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={60} color={COLORS.textSecondary} />
          <Text style={styles.errorText}>No PDF URL available for this book.</Text>
        </View>
      )}

      <CreateStoryModal
        visible={storyModalVisible}
        onClose={() => setStoryModalVisible(false)}
        initialBookTitle={title || "PDF Reader"}
      />
    </View>
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
    padding: 6,
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginHorizontal: 8,
  },
  storyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1b4323",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  storyBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 14,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
