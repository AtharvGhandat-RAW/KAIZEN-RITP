import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="mb-4 text-6xl sm:text-7xl md:text-8xl font-bold text-red-500" style={{
          textShadow: '0 0 30px rgba(255, 69, 0, 0.5)'
        }}>404</h1>
        <p className="mb-6 text-lg sm:text-xl md:text-2xl text-white/70">Oops! Page not found</p>
        <p className="mb-8 text-sm sm:text-base text-white/50">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" className="inline-block px-6 sm:px-8 py-3 border-2 border-red-600 text-red-500 hover:bg-red-600/10 transition-all text-sm sm:text-base">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
