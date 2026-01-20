function ChatListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
          {/* Avatar Skeleton */}
          <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>

          {/* Info Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatListSkeleton;
