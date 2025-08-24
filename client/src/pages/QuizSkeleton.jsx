export default function QuizSkeleton() {
  return (
    <div className="bg-gray-200 p-6 rounded-2xl shadow-md animate-pulse">
      <div className="h-8 bg-gray-300 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-300 rounded w-1/4 mb-6"></div>
      <div className="flex justify-end">
        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
      </div>
    </div>
  );
}