import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CurrencyDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg" | "xl";
  showSign?: boolean;
  showTrend?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

export function CurrencyDisplay({
  amount,
  size = "md",
  showSign = false,
  showTrend = false,
  className,
  animate = false,
}: CurrencyDisplayProps) {
  const isPositive = amount >= 0;
  const formattedAmount = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const content = (
    <span
      className={cn(
        "font-mono font-medium inline-flex items-center gap-1",
        sizeClasses[size],
        showSign && isPositive && "text-success",
        showSign && !isPositive && "text-destructive",
        className
      )}
    >
      {showTrend && (
        <span className="mr-0.5">
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </span>
      )}
      {showSign && (isPositive ? "+" : "-")}
      F${formattedAmount}
    </span>
  );

  if (animate) {
    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={amount}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {content}
        </motion.span>
      </AnimatePresence>
    );
  }

  return content;
}

interface BalanceCardProps {
  balance: number;
  label?: string;
  className?: string;
}

export function BalanceCard({ balance, label = "Balance", className }: BalanceCardProps) {
  return (
    <div className={cn("card-casino p-6", className)}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <CurrencyDisplay amount={balance} size="xl" className="text-foreground" />
    </div>
  );
}
