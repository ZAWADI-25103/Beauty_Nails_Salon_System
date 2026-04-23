import { cn } from "./ui/utils";

const LoaderBN = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center min-h-screen bg-white dark:bg-gray-950", className)}>
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 animate-pulse">
        Beauty Nails
      </h1>
    </div>
  );
};

export default LoaderBN;