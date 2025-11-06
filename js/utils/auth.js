// OAuth認証関連のユーティリティ

const AuthUtils = {
  /**
   * Google OAuthログインを開始
   */
  startAuth() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CONFIG.CLIENT_ID}&redirect_uri=${CONFIG.REDIRECT_URI}&response_type=token&scope=${CONFIG.SCOPES}`;
    window.location = authUrl;
  },

  /**
   * URLからアクセストークンを取得
   * @returns {string|null} アクセストークン
   */
  getTokenFromUrl() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");
    
    if (token) {
      // URLからハッシュを削除（トークンを隠す）
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    return token;
  },

  /**
   * トークンが有効かチェック（簡易版）
   * @param {string} token - アクセストークン
   * @returns {boolean}
   */
  isTokenValid(token) {
    return token && token.length > 0;
  }
};
