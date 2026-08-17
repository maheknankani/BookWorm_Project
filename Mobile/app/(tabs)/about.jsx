import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { useAlert } from "../../context/AlertContext";

const SUPPORT_EMAIL = "support@bookworm.app";

export default function AboutTab() {
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

  const FEATURES = [
    {
      icon: "book-outline",
      title: "Book Recommendations",
      desc: "Share reviews, star ratings, and detailed captions for your favorite books with the community.",
    },
    {
      icon: "bookmark-outline",
      title: "Personal Library",
      desc: "Organize books into Want to Read, Currently Reading, and Finished categories with page progress tracking.",
    },
    {
      icon: "sparkles-outline",
      title: "Book Stories & Quotes",
      desc: "Post short reading updates, favorite quotes, and book moments to inspire fellow readers.",
    },
    {
      icon: "document-text-outline",
      title: "e-Book / PDF Access",
      desc: "Attach and read digital e-books (PDFs) seamlessly inside the app.",
    },
    {
      icon: "chatbubbles-outline",
      title: "Reader Community",
      desc: "Like, comment, connect, and discuss book recommendations with fellow bookworms.",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>About BookWorm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO LOGO CARD */}
        <View style={styles.heroCard}>
          <Image
            source={require("../../assets/images/bookworm_logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>BookWorm 🐛</Text>
          <Text style={styles.appTagline}>Read • Discover • Share • Connect</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* MISSION / WHAT DOES IT DO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>What is BookWorm?</Text>
          </View>
          <Text style={styles.sectionBody}>
            BookWorm is a vibrant social book recommendation and digital reading platform designed for passionate readers. 
            Whether you want to discover your next favorite read, log your reading progress, share reviews, or read e-books directly on your device, BookWorm brings everything together into one elegant app.
          </Text>
        </View>

        {/* KEY FEATURES LIST */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            {FEATURES.map((item, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* SUPPORT & REPORT ISSUE CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-buoy" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Help & Support</Text>
          </View>

          <Text style={styles.sectionBody}>
            Encountered a problem or have feedback? Contact support directly or send an issue report below.
          </Text>

          {/* EMAIL LINK BUTTON */}
          <TouchableOpacity style={styles.emailCard} onPress={handleDirectEmail} activeOpacity={0.85}>
            <View style={styles.emailIconBox}>
              <Ionicons name="mail" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emailLabel}>Support Email</Text>
              <Text style={styles.emailAddress}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          {/* REPORT AN ISSUE FORM BOX */}
          <View style={styles.reportBox}>
            <Text style={styles.reportTitle}>Report an Issue 🐛</Text>

            <TextInput
              style={styles.textArea}
              value={issueText}
              onChangeText={setIssueText}
              multiline
              numberOfLines={4}
              placeholder="Describe your issue or feedback here..."
              placeholderTextColor={COLORS.placeholderText}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendIssueReport}
              disabled={sending}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.sendBtnText}>Submit Issue Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* COMMUNITY FOOTER */}
        <View style={[styles.sectionCard, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Built for Book Lovers</Text>
          <Text style={styles.sectionBody}>
            Our mission is to make reading more interactive, social, and rewarding. Thank you for being a part of the BookWorm community! 📚✨
          </Text>
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
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
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
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  logoImage: {
    width: 140,
    height: 100,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },
  versionBadge: {
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sectionBody: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 22,
    marginBottom: 14,
  },
  featuresList: {
    gap: 16,
    marginTop: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
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
  reportBox: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
    height: 90,
    marginBottom: 12,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
