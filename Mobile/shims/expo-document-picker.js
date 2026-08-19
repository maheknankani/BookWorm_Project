import DocumentPicker from "react-native-document-picker";

export const getDocumentAsync = async () => {
  try {
    const res = await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.pdf],
    });
    return {
      type: "success",
      canceled: false,
      assets: [
        {
          uri: res.uri,
          name: res.name,
          size: res.size,
          mimeType: res.type,
        },
      ],
    };
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      return { canceled: true, type: "cancel" };
    }
    throw err;
  }
};
