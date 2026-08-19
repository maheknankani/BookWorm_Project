import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";
import COLORS from "../constants/colors";

const { width } = Dimensions.get("window");
const LOGO_WIDTH = Math.min(width * 0.48, 185);
const LOGO_HEIGHT = Math.round(LOGO_WIDTH / 1.43);

export default function AnimatedSplashScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  // Animated values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(-0.08)).current; // rad
  const logoFloatY = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(25)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const authRef = useRef({ user, token });

  useEffect(() => {
    authRef.current = { user, token };
  }, [user, token]);

  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // 1. Entrance animation sequence
    Animated.sequence([
      // Logo Entrance (Pop & Fade)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      // Text Entrance (Slide & Fade)
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();

    // 2. Continuous Gentle Floating loop for the BookWorm logo character
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloatY, {
          toValue: -8,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(logoFloatY, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );
    floatLoop.start();

    // 3. Exit timeout to transition to main app after ~2.2 seconds
    const timer = setTimeout(() => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;

      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        floatLoop.stop();
        const { user: currentUser, token: currentToken } = useAuthStore.getState();
        const isSignedIn = Boolean(currentUser && currentToken);
        if (isSignedIn) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)");
        }
      });
    }, 2200);

    return () => {
      clearTimeout(timer);
      floatLoop.stop();
    };
  }, []);

  const rotateInterpolate = logoRotate.interpolate({
    inputRange: [-0.1, 0],
    outputRange: ["-6deg", "0deg"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />

      <View style={styles.content}>
        {/* ANIMATED BOOKWORM LOGO */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoFloatY },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <Image
            source={require("../assets/images/bookworm_logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ANIMATED TEXT CONTENT */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: "center",
          }}
        >
          <Text style={styles.title}>BookWorm</Text>
          <Text style={styles.tagline}>Read • Discover • Share • Connect</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#1B4323",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E6930",
    letterSpacing: 1.2,
    textAlign: "center",
  },
});
