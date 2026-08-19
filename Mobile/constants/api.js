// Set API_URL to local server IP (matching your Expo server 192.168.100.11) or Vercel
export const LOCAL_API_URL = "http://192.168.100.11:5000/api";
export const PROD_API_URL = "https://book-worm-project-mauve.vercel.app/api";

// Use LOCAL_API_URL during local development so backend changes on port 5000 work immediately
export const API_URL = LOCAL_API_URL;
