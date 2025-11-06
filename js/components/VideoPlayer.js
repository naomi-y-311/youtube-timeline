// 動画プレイヤーコンポーネント

const VideoPlayer = ({ video, onBack }) => {
  return (
    <div className="mt-4">
      <button
        onClick={onBack}
        className="text-blue-400 hover:text-blue-300 underline mb-4 flex items-center gap-2"
      >
        <Icon name="ArrowLeft" size={20} />
        一覧に戻る
      </button>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video.id.videoId}`}
            title={video.snippet.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
        
        <div className="p-4">
          <h2 className="text-lg font-bold mb-2">{video.snippet.title}</h2>
          <p className="text-gray-400 text-sm mb-2">{video.snippet.channelTitle}</p>
          <p className="text-gray-500 text-xs">
            公開日: {new Date(video.snippet.publishedAt).toLocaleDateString('ja-JP')}
          </p>
          {video.snippet.description && (
            <p className="text-gray-300 text-sm mt-4 whitespace-pre-wrap">
              {video.snippet.description.slice(0, 300)}
              {video.snippet.description.length > 300 && '...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
