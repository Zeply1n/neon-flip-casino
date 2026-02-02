import { Navbar } from "./Navbar";
import { LiveFeed } from "./LiveFeed";
import { motion } from "framer-motion";

interface MainLayoutProps {
  children: React.ReactNode;
  showLiveFeed?: boolean;
}

export function MainLayout({ children, showLiveFeed = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero glow effect */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />
      
      <Navbar />
      
      <div className="container py-6">
        <div className={`flex gap-6 ${showLiveFeed ? "lg:pr-80" : ""}`}>
          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-0"
          >
            {children}
          </motion.main>
        </div>

        {/* Live Feed Sidebar - Desktop */}
        {showLiveFeed && (
          <aside className="hidden lg:block fixed right-0 top-16 w-80 h-[calc(100vh-4rem)] p-4 overflow-y-auto border-l border-border/50 bg-background/80 backdrop-blur-sm">
            <LiveFeed />
          </aside>
        )}
      </div>
    </div>
  );
}
