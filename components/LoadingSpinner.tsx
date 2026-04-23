import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 dark:text-purple-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">Chargement...</p>
      </div>
    </div>
  );
}