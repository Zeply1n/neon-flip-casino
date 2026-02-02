import { motion, AnimatePresence } from "framer-motion";
import { Coins, Bomb, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

interface BetActivity {
  id: string;
  username: string;
  game: "coinflip" | "mines";
  bet: number;
  multiplier: number;
  profit: number;
  timestamp: Date;
}

// Mock data generator - will be replaced with real WebSocket feed
const generateMockBet = (): BetActivity => {
  const games = ["coinflip", "mines"] as const;
  const usernames = ["CryptoKing", "LuckyAce", "DiamondHands", "MoonShot", "HighRoller", "GoldRush", "SilverFox", "NightOwl"];
  const game = games[Math.floor(Math.random() * games.length)];
  const bet = Math.floor(Math.random() * 500) + 10;
  const isWin = Math.random() > 0.45;
  const multiplier = isWin ? (game === "coinflip" ? 1.96 : Math.random() * 5 + 1) : 0;
  
  return {
    id: Math.random().toString(36).substring(7),
    username: usernames[Math.floor(Math.random() * usernames.length)],
    game,
    bet,
    multiplier: Number(multiplier.toFixed(2)),
    profit: Number((bet * multiplier - bet).toFixed(2)),
    timestamp: new Date(),
  };
};

const GameIcon = ({ game }: { game: "coinflip" | "mines" }) => {
  if (game === "coinflip") {
    return <Coins className="w-4 h-4" />;
  }
  return <Bomb className="w-4 h-4" />;
};

export function LiveFeed() {
  const [activities, setActivities] = useState<BetActivity[]>([]);

  useEffect(() => {
    // Initialize with some activities
    const initial = Array.from({ length: 8 }, generateMockBet);
    setActivities(initial);

    // Simulate live updates
    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateMockBet();
        return [newActivity, ...prev.slice(0, 14)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-casino p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="live-dot" />
        <h3 className="font-semibold text-foreground">Live Bets</h3>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30 ${
                activity.profit > 0 ? "border-l-2 border-l-success" : "border-l-2 border-l-destructive/50"
              }`}
            >
              <div className={`p-2 rounded-lg ${activity.game === "coinflip" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                <GameIcon game={activity.game} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.username}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {activity.game}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1">
                  {activity.profit > 0 ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  )}
                  <span
                    className={`text-sm font-mono font-medium ${
                      activity.profit > 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {activity.profit > 0 ? "+" : ""}F${activity.profit.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {activity.multiplier > 0 ? `${activity.multiplier}x` : "0x"}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
