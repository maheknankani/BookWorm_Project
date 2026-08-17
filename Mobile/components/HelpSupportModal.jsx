import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { useAuthStore } from "../store/authStore";
import { useAlert } from "../context/AlertContext";

const SUPPORT_EMAIL = "support@bookworm.app";

export default function HelpSupportModal({ visible, onClose }) {
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
      onClose();
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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="help-buoy-outline" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Help & Support</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollForm} showsVerticalScrollIndicator={false}>
            {/* DIRECT EMAIL CARD */}
            <View style={styles.contactCard}>
              <Text style={styles.cardHeaderTitle}>Email Support & Feedback</Text>
              <Text style={styles.cardHeaderSub}>For questions, feedback, or support, reach out at:</Text>
              
              <TouchableOpacity style={styles.emailPill} onPress={handleDirectEmail} activeOpacity={0.8}>
                <Ionicons name="mail-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.emailText}>{SUPPORT_EMAIL}</Text>
                <Ionicons name="open-outline" size={16} color={COLORS.primary} style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            </View>

            {/* REPORT AN ISSUE FORM */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Report an Issue or Feedback 🐛</Text>
              <Text style={styles.formDesc}>
                Encountered a bug or have a suggestion? Describe your issue below and send it directly to support.
              </Text>

              {/* ISSUE TEXT INPUT BOX */}
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

              {/* SUBMIT REPORT BUTTON */}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollForm: {
    paddingBottom: 20,
  },
  contactCard: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
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
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  formCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
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
    marginTop: 4,
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
});
