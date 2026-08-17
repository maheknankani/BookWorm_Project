import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
  const router = useRouter();

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
      {/* TOP NAV BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>About BookWorm</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO LOGO CARD */}
        <View style={styles.heroCard}>
          <Image
            source={require("../assets/images/bookworm_logo.png")}
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

        {/* COMMUNITY GUIDELINES & FOOTER */}
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
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 22,
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
});
