// メインアプリケーション

const { useState, useEffect } = React;

function YouTubeSubscriptionTimeline() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // 初期化: URLからトークンを取得
  useEffect(() => {
    const token = AuthUtils.getTokenFromUrl();
    if (token) {
      setAccessToken(token);
      setIsSignedIn(true);
    }
  }, []);

  // トークン取得後、動画をフェッチ
  useEffect(() => {
    if (accessToken) {
      loadVideos();
    }
  }, [accessToken]);

  // 動画読み込み
  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const videoData = await YouTubeAPI.fetchAllVideos(accessToken);
      setVideos(videoData);
    } catch (err) {
      console.error(err);
      setError("動画の取得中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const handleLogout = () => {
    setIsSignedIn(false);
    setAccessToken(null);
    setVideos([]);
    setSelectedVideo(null);
    localStorage.removeItem(CONFIG.CACHE_KEY);
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Icon name="Video" />
        YouTube Subscription Timeline
      </h1>

      {!isSignedIn ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6">
            Googleアカウントでログインして、登録チャンネルの最新動画を表示します
          </p>
          <button
            onClick={AuthUtils.startAuth}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition"
          >
            <Icon name="LogIn" />
            Googleでログイン
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={loadVideos}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <Icon name="RefreshCw" size={18} />
              更新
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <Icon name="LogOut" size={18} />
              ログアウト
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-400">読み込み中...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {selectedVideo ? (
            <VideoPlayer 
              video={selectedVideo} 
              onBack={() => setSelectedVideo(null)} 
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {videos.map((video) => {
              // playlistItems.list の構造に対応
              const videoId =
                video.snippet?.resourceId?.videoId ||
                video.id?.videoId ||
                video.id;
            return (
              <VideoCard
                 key={videoId}
                 video={video}
                 onClick={() => setSelectedVideo(videoId)}
              />
            );
          })}
          </div>
          )}
  

          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              動画が見つかりませんでした
            </div>
          )}
        </>
      )}
    </div>
  );
}

// アプリケーションをマウント
ReactDOM.createRoot(document.getElementById("root")).render(
  <YouTubeSubscriptionTimeline />
);
