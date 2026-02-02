import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Hero glow effect */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        {/* 404 Text */}
        <motion.h1
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="text-9xl font-bold text-gradient-primary mb-4"
        >
          404
        </motion.h1>

        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like this page doesn't exist. Maybe it got flipped away?
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link to="/">
            <Button variant="casino" className="gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
