
import { Home  } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
    

    
        <h1 className="text-9xl font-extrabold text-[#3f93e8] tracking-widest">
          404
        </h1>
        <div className="bg-[#f5f6fa] px-2 text-sm rounded rotate-12 absolute transform -translate-y-16 ml-24 border border-gray-200 text-gray-500">
          Page Not Found
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mt-4">
          Oops! You seem to be lost.
        </h2>
        <p className="text-gray-500 mt-2 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>

        {/* Action Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#3f93e8] hover:bg-[#2c3e56] text-white font-semibold px-5 py-2 rounded transition-all shadow-md active:scale-95"
        >
          <Home size={18} />
          Back to Homepage
        </Link>
      </div>

      
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50"></div>
      </div>
    </div>
  );
};

export default NotFound;