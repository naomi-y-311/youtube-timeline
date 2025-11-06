// 動画カードコンポーネント

const Icon = ({ name, size = 24, color = "currentColor" }) => {
  try {
    const iconData = lucide.icons[name];
    if (!iconData) return null;

    const svgElement = lucide.createElement(iconData);
    svgElement.setAttribute("width", size);
    svgElement.setAttribute("height", size);
    svgElement.setAttribute("stroke", color);
    svgElement.setAttribute("fill", "none");
    svgElement.setAttribute("stroke-width", "2");

    return (
      <span
        style={{
          pointerEvents: "none",
          display: "inline-flex",
          verticalAlign: "middle"
        }}
        dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }}
      />
    );
  } catch (e) {
    console.error("Icon render error:", name, e);
    return null;
  }
};

const VideoCard = ({ video, onClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const videoId =
    video.snippet?.resourceId?.videoId ||
    video.id?.videoId ||
    video.id;

  return (
    <div
      onClick={() => onClick(videoId)}
      className="video-card bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition group relative z-10"
    >
      <img
        src={video.snippet?.thumbnails?.medium?.url || ""}
        alt={video.snippet?.title || ""}
        className="w-full"
      />
      <div className="p-2">
        <p className="text-sm font-semibold group-hover:text-blue-400 line-clamp-2">
          {video.snippet?.title}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {video.snippet?.channelTitle}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDate(video.snippet?.publishedAt)}
        </p>
      </div>
    </div>
  );
};
