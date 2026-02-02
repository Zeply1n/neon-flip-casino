import { motion } from "framer-motion";
import { MapPin, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Geoblock() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Hero glow effect */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-destructive/10 flex items-center justify-center"
        >
          <MapPin className="w-12 h-12 text-destructive" />
        </motion.div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Access Restricted
        </h1>
        <p className="text-muted-foreground mb-8">
          VersFlip is not available in your region due to local regulations. 
          We apologize for any inconvenience.
        </p>

        {/* Info Card */}
        <div className="card-casino p-6 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-2">Why is this happening?</h3>
              <p className="text-sm text-muted-foreground">
                Due to licensing and regulatory requirements, we cannot offer our 
                services in certain jurisdictions. This helps us maintain compliance 
                and protect our users.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </Link>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-8">
          If you believe this is an error, please contact support.
        </p>
      </motion.div>
    </div>
  );
}
