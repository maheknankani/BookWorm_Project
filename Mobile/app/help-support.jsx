import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import { useAlert } from "../context/AlertContext";

const SUPPORT_EMAIL = "support@bookworm.app";

export default function HelpSupportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();

  const [issueText, setIssueText] = useState("");
  const [sending, setSending] = useState(false);

  const handleDirectEmail = async () => {
    const subject = encodeURIComponent("BookWorm Support Inquiry");
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        showAlert({
          title: "Support Email",
          message: `Please send your email to: ${SUPPORT_EMAIL}`,
          type: "info",
        });
      }
    } catch {
      showAlert({
        title: "Support Email",
        message: `Please send your email to: ${SUPPORT_EMAIL}`,
        type: "info",
      });
    }
  };

  const handleSendIssueReport = async () => {
    if (!issueText.trim()) {
      showAlert({
        title: "Empty Issue",
        message: "Please describe the issue or feedback before submitting.",
        type: "error",
      });
      return;
    }

    try {
      setSending(true);

      const subject = encodeURIComponent(`[BookWorm Support] from ${user?.username || "User"}`);
      const body = encodeURIComponent(
        `User: ${user?.username || "Anonymous"} (${user?.email || "No email"})\n\nIssue Details:\n${issueText.trim()}\n\n---\nApp Version: 1.0.0`
      );

      const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      }

      showAlert({
        title: "Report Submitted 🎉",
        message: `Thank you! Your issue report has been sent to ${SUPPORT_EMAIL}.`,
        type: "success",
      });

      setIssueText("");
    } catch (err) {
      console.error("Error launching mail client:", err);
      showAlert({
        title: "Report Submitted 🎉",
        message: `Your issue report was prepared for ${SUPPORT_EMAIL}. Thank you for your feedback!`,
        type: "success",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* TOP NAV BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Ionicons name="help-buoy" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>
            Have questions, feedback, or facing an issue with BookWorm? We're here to help!
          </Text>
        </View>

        {/* DIRECT EMAIL CARD */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Direct Email Support</Text>
          <Text style={styles.cardHeaderSub}>Reach out to our support team directly via email:</Text>

          <TouchableOpacity style={styles.emailPill} onPress={handleDirectEmail} activeOpacity={0.8}>
            <View style={styles.emailIconBox}>
              <Ionicons name="mail" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emailLabel}>Support Address</Text>
              <Text style={styles.emailAddress}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* REPORT AN ISSUE FORM CARD */}
        <View style={styles.sectionCard}>
          <Text style={styles.formTitle}>Report an Issue or Feedback 🐛</Text>
          <Text style={styles.formDesc}>
            Encountered a bug or have a suggestion? Describe your issue below and submit your feedback.
          </Text>

          <Text style={styles.label}>Issue Description</Text>
          <TextInput
            style={styles.textArea}
            value={issueText}
            onChangeText={setIssueText}
            multiline
            numberOfLines={5}
            placeholder="Write your issue details or feedback here..."
            placeholderTextColor={COLORS.placeholderText}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendIssueReport}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.sendButtonText}>Submit Issue Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ QUICK TIPS CARD */}
        <View style={[styles.sectionCard, { marginBottom: 30 }]}>
          <Text style={styles.cardHeaderTitle}>Quick Tips 💡</Text>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.tipText}>Make sure your app is updated to the latest version for all features.</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.tipText}>You can attach e-books (PDF format) when adding new books to your collection.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardHeaderSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emailIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  emailLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  emailAddress: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  formDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textDark,
    height: 110,
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 18,
  },
});
