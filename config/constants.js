// YouTube API設定
const CONFIG = {
  API_KEY: "AIzaSyDbZFuM6Kk7LkpTD3gXFCZAil784fdE6xA",
  CLIENT_ID: "652862433755-rm9f5j7ln9qgcebi7sptkvifle4k8a9v.apps.googleusercontent.com",
  REDIRECT_URI: window.location.origin + window.location.pathname,
  SCOPES: "https://www.googleapis.com/auth/youtube.readonly",
  
  // API設定
  MAX_VIDEOS_PER_CHANNEL: 3,  // チャンネルごとの動画数
  CACHE_DURATION: 30 * 60 * 1000,  // キャッシュ有効期限（30分）
  
  // UI設定
  CACHE_KEY: "youtubeVideosCache"
};
