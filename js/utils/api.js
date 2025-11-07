// YouTube API関連のユーティリティ

const YouTubeAPI = {
  /**
   * キャッシュから動画データを取得
   * @returns {Array|null} キャッシュされた動画データ
   */
  getCache() {
    try {
      const cached = localStorage.getItem(CONFIG.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // キャッシュが有効期限内かチェック
      if (Date.now() - timestamp < CONFIG.CACHE_DURATION) {
        return data;
      }
      
      // 期限切れのキャッシュを削除
      localStorage.removeItem(CONFIG.CACHE_KEY);
      return null;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  },

  /**
   * 動画データをキャッシュに保存
   * @param {Array} data - 動画データ
   */
  setCache(data) {
    try {
      localStorage.setItem(
        CONFIG.CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error("Cache write error:", error);
    }
  },

  /**
   * 登録チャンネル一覧を取得
   * @param {string} token - アクセストークン
   * @returns {Promise<Array>} チャンネルID配列
   */
  async fetchSubscriptions(token) {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!response.ok) {
      throw new Error(`Subscriptions API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items.map(item => item.snippet.resourceId.channelId);
  },

    /** ===============================
   * チャンネルの「uploads playlist ID」を取得
   * =============================== */
  async fetchUploadsPlaylistId(channelId, token) {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error(`Channels API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  },

  /** ===============================
   * playlistItems.list で動画を取得（低クォータ版）
   * =============================== */
  
  async fetchChannelVideos(channelId, token) {
    // 1️⃣ アップロードプレイリストIDを取得
    const uploadsId = await this.fetchUploadsPlaylistId(channelId, token);
    if (!uploadsId) {
      console.warn(`No uploads playlist for channel ${channelId}`);
      return [];
    }

    // 2️⃣ プレイリストの動画を取得（最大50件中、設定分だけ）
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${CONFIG.MAX_VIDEOS_PER_CHANNEL}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!response.ok) {
      throw new Error(`PlaylistItems API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  },

  /**
   * 全チャンネルの動画を取得してソート
   * @param {string} token - アクセストークン
   * @returns {Promise<Array>} ソート済み動画データ配列
   */
  async fetchAllVideos(token) {
    // キャッシュチェック
    const cachedVideos = this.getCache();
    if (cachedVideos) {
      return cachedVideos;
    }

    // チャンネル一覧取得
    const channelIds = await this.fetchSubscriptions(token);
    
    // 各チャンネルの動画を取得
    const allVideos = [];
    const targetChannels = channelIds;
    
    for (const channelId of targetChannels) {
      try {
        const videos = await this.fetchChannelVideos(channelId, token);
        allVideos.push(...videos);
      } catch (error) {
        console.error(`Error fetching videos for channel ${channelId}:`, error);
      }
    }

    // すべてまとめて公開日でソートして上位20件を残す
    allVideos.sort(
      (a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
    );

    const latest10 = allVideos.slice(0, 20);

    // キャッシュに保存
    this.setCache(latest10);
    return latest10;
  }
};
