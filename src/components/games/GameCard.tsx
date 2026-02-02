import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  accentColor: "primary" | "warning" | "secondary";
  players?: number;
}

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20 hover:border-primary/40",
    glow: "shadow-primary/20 hover:shadow-primary/30",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20 hover:border-warning/40",
    glow: "shadow-warning/20 hover:shadow-warning/30",
  },
  secondary: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    border: "border-secondary/20 hover:border-secondary/40",
    glow: "shadow-secondary/20 hover:shadow-secondary/30",
  },
};

export function GameCard({
  title,
  description,
  icon: Icon,
  href,
  accentColor,
  players = 0,
}: GameCardProps) {
  const colors = colorClasses[accentColor];

  return (
    <Link to={href}>
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-card p-6 transition-all duration-300 shadow-lg ${colors.glow} hover:shadow-xl group`}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.bg}`} />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${colors.bg}`}>
              <Icon className={`w-8 h-8 ${colors.text}`} />
            </div>
            
            {players > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {players} playing
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>

          <Button variant="ghost" className={`gap-2 p-0 h-auto ${colors.text} hover:bg-transparent`}>
            Play Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Decorative element */}
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full ${colors.bg} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`} />
      </motion.div>
    </Link>
  );
}
