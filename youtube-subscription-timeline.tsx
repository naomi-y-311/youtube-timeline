<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>YouTube Subscription Timeline</title>
    <!-- React, Babel, Tailwind, Lucide を読み込み -->
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/lucide-react@0.344.0/dist/lucide-react.umd.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-900">
    <div id="root"></div>

    <script type="text/babel">
      // ✅ importの代わり
      const { useState, useEffect } = React;
      const { Video, LogIn, LogOut, RefreshCw, Play } = lucideReact;

      // ✅ ここからTSXコードを貼る
      const API_KEY = 'AIzaSyAQj9_bs47GFmHx4dhOM_DVwWhj0gT2ma0';
      const CLIENT_ID = '209571413251-6d0i4q3ud75boi9k874e1s0mhf4t53aa.apps.googleusercontent.com';
      const REDIRECT_URI = window.location.origin + window.location.pathname;
      const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

      function YouTubeSubscriptionTimeline() {
        const [isSignedIn, setIsSignedIn] = useState(false);
        const [videos, setVideos] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const [selectedVideo, setSelectedVideo] = useState(null);
        const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // Check for access token in URL hash (OAuth callback)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');

    if (token) {
      setAccessToken(token);
      setIsSignedIn(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchSubscriptionVideos(token);
    } else {
      // Check for stored token
      const storedToken = localStorage.getItem('youtube_access_token');
      const expiryTime = localStorage.getItem('youtube_token_expiry');
      
      if (storedToken && expiryTime && Date.now() < parseInt(expiryTime)) {
        setAccessToken(storedToken);
        setIsSignedIn(true);
        fetchSubscriptionVideos(storedToken);
      }
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('youtube_access_token', accessToken);
      // Token typically expires in 1 hour
      localStorage.setItem('youtube_token_expiry', (Date.now() + 3600000).toString());
    }
  }, [accessToken]);

  const handleSignIn = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&include_granted_scopes=true`;
    
    window.location.href = authUrl;
  };

  const handleSignOut = () => {
    localStorage.removeItem('youtube_access_token');
    localStorage.removeItem('youtube_token_expiry');
    setIsSignedIn(false);
    setAccessToken(null);
    setVideos([]);
    setSelectedVideo(null);
  };

  const fetchSubscriptionVideos = async (token) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get subscriptions
      const subsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50&key=${API_KEY}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!subsResponse.ok) {
        if (subsResponse.status === 401) {
          handleSignOut();
          throw new Error('認証の有効期限が切れました。再度ログインしてください。');
        }
        throw new Error('購読チャンネルの取得に失敗しました');
      }

      const subsData = await subsResponse.json();
      const channelIds = subsData.items.map(item => item.snippet.resourceId.channelId);

      // Get latest videos from each channel
      const allVideos = [];
      
      for (const channelId of channelIds.slice(0, 20)) { // Limit to 20 channels to avoid quota issues
        try {
          const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=3&key=${API_KEY}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            allVideos.push(...videosData.items);
          }
        } catch (err) {
          console.error(`Failed to fetch videos for channel ${channelId}`, err);
        }
      }

      // Sort by publish date
      allVideos.sort((a, b) => 
        new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
      );

      setVideos(allVideos.slice(0, 50));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (accessToken) {
      fetchSubscriptionVideos(accessToken);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <Video className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            購読チャンネル専用タイムライン
          </h1>
          <p className="text-gray-400 mb-6">
            おすすめや関連動画に惑わされず、<br />
            購読チャンネルの動画だけを見よう
          </p>
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleSignIn}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 w-full transition"
          >
            <LogIn size={20} />
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="text-red-500" size={28} />
            <h1 className="text-xl font-bold text-white">購読チャンネル</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition disabled:opacity-50"
              title="更新"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleSignOut}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <LogOut size={18} />
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {loading && videos.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="animate-spin text-red-500 mx-auto mb-4" size={40} />
            <p className="text-gray-400">動画を読み込んでいます...</p>
          </div>
        ) : selectedVideo ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedVideo(null)}
              className="text-gray-400 hover:text-white transition"
            >
              ← タイムラインに戻る
            </button>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                  title={selectedVideo.snippet.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-2">
                  {selectedVideo.snippet.title}
                </h2>
                <p className="text-gray-400 mb-2">{selectedVideo.snippet.channelTitle}</p>
                <p className="text-gray-500 text-sm">
                  {formatDate(selectedVideo.snippet.publishedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id.videoId}
                onClick={() => setSelectedVideo(video)}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition group"
              >
                <div className="relative">
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play className="text-white" size={48} />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-white font-semibold mb-1 line-clamp-2">
                    {video.snippet.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">
                    {video.snippet.channelTitle}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDate(video.snippet.publishedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && videos.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-400">動画が見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}

      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(<YouTubeSubscriptionTimeline />);
    </script>
  </body>
</html>
