import { launchImageLibrary } from "react-native-image-picker";

export const MediaTypeOptions = {
  Images: "photo",
  Videos: "video",
  All: "mixed",
};

export const requestMediaLibraryPermissionsAsync = async () => {
  return { status: "granted", granted: true };
};

export const launchImageLibraryAsync = async (options = {}) => {
  return new Promise((resolve) => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: options.quality || 0.8,
        includeBase64: options.base64 !== false,
      },
      (response) => {
        if (response.didCancel || response.errorCode) {
          resolve({ canceled: true, assets: [] });
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          resolve({
            canceled: false,
            assets: [
              {
                uri: asset.uri,
                base64: asset.base64,
                width: asset.width,
                height: asset.height,
              },
            ],
          });
        } else {
          resolve({ canceled: true, assets: [] });
        }
      }
    );
  });
};
