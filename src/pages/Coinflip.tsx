import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ArrowRight, History, RotateCcw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/ui/currency-display";

type CoinSide = "heads" | "tails";
type GameState = "betting" | "flipping" | "result";

interface GameResult {
  id: string;
  bet: number;
  choice: CoinSide;
  result: CoinSide;
  profit: number;
  timestamp: Date;
}

export default function Coinflip() {
  const [betAmount, setBetAmount] = useState<string>("10");
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [result, setResult] = useState<CoinSide | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  
  const balance = 1250.50; // Mock balance
  const houseEdge = 0.02; // 2%
  const multiplier = 2 * (1 - houseEdge); // 1.96x

  const handleBet = () => {
    if (!selectedSide || !betAmount || parseFloat(betAmount) <= 0) return;
    
    setGameState("flipping");
    
    // Simulate coin flip animation
    setTimeout(() => {
      const flipResult: CoinSide = Math.random() > 0.5 ? "heads" : "tails";
      setResult(flipResult);
      setGameState("result");
      
      const won = flipResult === selectedSide;
      const profit = won ? parseFloat(betAmount) * (multiplier - 1) : -parseFloat(betAmount);
      
      setHistory((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          bet: parseFloat(betAmount),
          choice: selectedSide,
          result: flipResult,
          profit,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    }, 1500);
  };

  const resetGame = () => {
    setGameState("betting");
    setResult(null);
    setSelectedSide(null);
  };

  const adjustBet = (multiplier: number) => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount((current * multiplier).toFixed(2));
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Coins className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Coinflip</h1>
            <p className="text-muted-foreground">Pick a side and double your F$</p>
          </div>
        </div>

        {/* Game Area */}
        <div className="card-casino p-8 mb-6">
          {/* Coin Display */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={
                gameState === "flipping"
                  ? { rotateY: [0, 1800] }
                  : { rotateY: 0 }
              }
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative w-40 h-40"
              style={{ perspective: 1000 }}
            >
              <div
                className={`w-full h-full rounded-full flex items-center justify-center text-6xl font-bold border-4 ${
                  result === "heads"
                    ? "bg-gradient-to-br from-primary to-primary-glow border-primary/50 text-primary-foreground"
                    : result === "tails"
                    ? "bg-gradient-to-br from-warning to-warning/80 border-warning/50 text-warning-foreground"
                    : "bg-gradient-to-br from-muted to-muted/80 border-border text-muted-foreground"
                } shadow-2xl`}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                {gameState === "result" ? (
                  result === "heads" ? "H" : "T"
                ) : (
                  "?"
                )}
              </div>
            </motion.div>
          </div>

          {/* Result Message */}
          <AnimatePresence>
            {gameState === "result" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mb-6"
              >
                <p className={`text-2xl font-bold ${
                  result === selectedSide ? "text-success" : "text-destructive"
                }`}>
                  {result === selectedSide ? "You Won!" : "You Lost"}
                </p>
                <CurrencyDisplay
                  amount={
                    result === selectedSide
                      ? parseFloat(betAmount) * (multiplier - 1)
                      : -parseFloat(betAmount)
                  }
                  size="lg"
                  showSign
                  className="mt-2"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Side Selection */}
          {gameState === "betting" && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide("heads")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedSide === "heads"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-4xl mb-2">👑</div>
                <p className="font-semibold text-foreground">Heads</p>
                <p className="text-sm text-muted-foreground">{multiplier}x payout</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide("tails")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedSide === "tails"
                    ? "border-warning bg-warning/10 shadow-lg shadow-warning/20"
                    : "border-border hover:border-warning/50"
                }`}
              >
                <div className="text-4xl mb-2">🦅</div>
                <p className="font-semibold text-foreground">Tails</p>
                <p className="text-sm text-muted-foreground">{multiplier}x payout</p>
              </motion.button>
            </div>
          )}

          {/* Bet Input */}
          {gameState === "betting" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                    F$
                  </span>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="pl-10 font-mono text-lg h-12"
                    placeholder="0.00"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => adjustBet(0.5)}
                  className="h-12"
                >
                  ½
                </Button>
                <Button
                  variant="outline"
                  onClick={() => adjustBet(2)}
                  className="h-12"
                >
                  2×
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(balance.toString())}
                  className="h-12"
                >
                  Max
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Balance: <CurrencyDisplay amount={balance} /></span>
                <span>
                  Potential Win: <CurrencyDisplay amount={parseFloat(betAmount || "0") * multiplier} className="text-success" />
                </span>
              </div>

              <Button
                variant="casino"
                size="xl"
                className="w-full"
                disabled={!selectedSide || !betAmount || parseFloat(betAmount) <= 0}
                onClick={handleBet}
              >
                Flip Coin
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Play Again */}
          {gameState === "result" && (
            <div className="flex justify-center">
              <Button variant="casino" size="lg" onClick={resetGame} className="gap-2">
                <RotateCcw className="w-5 h-5" />
                Play Again
              </Button>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="card-casino p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Recent Games</h3>
            </div>
            <div className="space-y-2">
              {history.map((game) => (
                <div
                  key={game.id}
                  className={`flex items-center justify-between p-3 rounded-lg bg-muted/30 border-l-2 ${
                    game.profit > 0 ? "border-l-success" : "border-l-destructive"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {game.result === "heads" ? "👑" : "🦅"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Bet on {game.choice}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Result: {game.result}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={game.profit} size="sm" showSign />
                    <p className="text-xs text-muted-foreground font-mono">
                      F${game.bet.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
