import { useNavigation, useRoute } from "@react-navigation/native";

export function useRouter() {
  const navigation = useNavigation();

  return {
    push: (target, extraParams) => {
      if (typeof target === "string") {
        if (target.startsWith("/book/pdf-viewer")) {
          navigation.navigate("PdfViewer", extraParams || {});
        } else if (target.startsWith("/book/")) {
          const id = target.split("/book/")[1];
          navigation.navigate("BookDetails", { id, ...extraParams });
        } else if (target === "/notifications") {
          navigation.navigate("Notifications");
        } else if (target === "/help-support") {
          navigation.navigate("HelpSupport");
        } else if (target === "/create") {
          navigation.navigate("MainTabs", { screen: "CreateTab" });
        } else if (target === "/(tabs)") {
          navigation.navigate("MainTabs");
        } else if (target === "/(auth)") {
          navigation.navigate("AuthStack");
        } else {
          navigation.navigate(target, extraParams);
        }
      } else if (typeof target === "object" && target !== null) {
        const pathname = target.pathname || "";
        const params = { ...(target.params || {}), ...(extraParams || {}) };

        if (pathname.startsWith("/book/pdf-viewer")) {
          navigation.navigate("PdfViewer", params);
        } else if (pathname.startsWith("/book/")) {
          const id = pathname.split("/book/")[1];
          navigation.navigate("BookDetails", { id, ...params });
        } else {
          navigation.navigate(pathname, params);
        }
      }
    },
    replace: (target, extraParams) => {
      if (typeof target === "string") {
        if (target === "/(tabs)") {
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        } else if (target === "/(auth)") {
          navigation.reset({
            index: 0,
            routes: [{ name: "AuthStack" }],
          });
        } else {
          navigation.replace(target, extraParams);
        }
      }
    },
    back: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("MainTabs");
      }
    },
  };
}

export function useLocalSearchParams() {
  const route = useRoute();
  return route.params || {};
}
