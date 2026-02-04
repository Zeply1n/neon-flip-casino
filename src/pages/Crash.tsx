import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Zap, TrendingUp, History, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type GamePhase = "waiting" | "flying" | "crashed" | "cashedout";

interface GameState {
  id: string | null;
  phase: GamePhase;
  multiplier: number;
  crashPoint: number | null;
  betAmount: number;
  cashoutMultiplier: number | null;
  payout: number | null;
}

export default function Crash() {
  const { balance, refreshBalance, session } = useAuth();
  const { toast } = useToast();
  
  const [betInput, setBetInput] = useState("10");
  const [autoCashout, setAutoCashout] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gameHistory, setGameHistory] = useState<{ crashPoint: number; won: boolean }[]>([]);
  
  const [game, setGame] = useState<GameState>({
    id: null,
    phase: "waiting",
    multiplier: 1.00,
    crashPoint: null,
    betAmount: 0,
    cashoutMultiplier: null,
    payout: null,
  });

  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const crashPointRef = useRef<number>(0);

  // Simulate multiplier growth
  const updateMultiplier = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = (timestamp - startTimeRef.current) / 1000;
    // Exponential growth formula: e^(0.1 * t)
    const newMultiplier = Math.exp(0.08 * elapsed);
    
    if (newMultiplier >= crashPointRef.current) {
      // Crashed!
      setGame(prev => ({
        ...prev,
        phase: "crashed",
        multiplier: crashPointRef.current,
      }));
      setGameHistory(prev => [{ crashPoint: crashPointRef.current, won: false }, ...prev.slice(0, 9)]);
      return;
    }
    
    setGame(prev => ({
      ...prev,
      multiplier: Math.floor(newMultiplier * 100) / 100,
    }));
    
    animationRef.current = requestAnimationFrame(updateMultiplier);
  }, []);

  // Start game
  const handleBet = async () => {
    const amount = parseFloat(betInput);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid bet amount", variant: "destructive" });
      return;
    }
    if (amount > balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('crash-game/start', {
        body: { betAmount: amount }
      });
      
      if (error) throw error;
      
      crashPointRef.current = data.crashPoint;
      startTimeRef.current = undefined;
      
      setGame({
        id: data.gameId,
        phase: "flying",
        multiplier: 1.00,
        crashPoint: null,
        betAmount: amount,
        cashoutMultiplier: null,
        payout: null,
      });
      
      refreshBalance();
      animationRef.current = requestAnimationFrame(updateMultiplier);
      
    } catch (err: any) {
      console.error('Crash start error:', err);
      toast({ title: err.message || "Failed to start game", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Cashout
  const handleCashout = async () => {
    if (game.phase !== "flying" || !game.id) return;
    
    // Stop animation immediately
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const currentMultiplier = game.multiplier;
    
    try {
      const { data, error } = await supabase.functions.invoke('crash-game/cashout', {
        body: { gameId: game.id, multiplier: currentMultiplier }
      });
      
      if (error) throw error;
      
      const payout = data.payout;
      
      setGame(prev => ({
        ...prev,
        phase: "cashedout",
        cashoutMultiplier: currentMultiplier,
        payout,
      }));
      
      setGameHistory(prev => [{ crashPoint: currentMultiplier, won: true }, ...prev.slice(0, 9)]);
      refreshBalance();
      
      toast({
        title: `Cashed out at ${currentMultiplier.toFixed(2)}x!`,
        description: `You won F$${payout.toFixed(2)}`,
      });
      
    } catch (err: any) {
      console.error('Cashout error:', err);
      toast({ title: err.message || "Cashout failed", variant: "destructive" });
    }
  };

  // Reset game
  const resetGame = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setGame({
      id: null,
      phase: "waiting",
      multiplier: 1.00,
      crashPoint: null,
      betAmount: 0,
      cashoutMultiplier: null,
      payout: null,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Auto-cashout logic
  useEffect(() => {
    if (game.phase === "flying" && autoCashout) {
      const autoCashoutValue = parseFloat(autoCashout);
      if (!isNaN(autoCashoutValue) && game.multiplier >= autoCashoutValue) {
        handleCashout();
      }
    }
  }, [game.multiplier, game.phase, autoCashout]);

  const getMultiplierColor = () => {
    if (game.phase === "crashed") return "text-destructive";
    if (game.phase === "cashedout") return "text-success";
    if (game.multiplier >= 5) return "text-warning";
    if (game.multiplier >= 2) return "text-success";
    return "text-primary";
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-warning/10">
            <Rocket className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crash</h1>
            <p className="text-muted-foreground">Cash out before the rocket crashes!</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <div className="card-casino p-6 aspect-[16/10] relative overflow-hidden flex flex-col items-center justify-center">
              {/* Background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
              
              {/* Multiplier display */}
              <motion.div
                key={game.multiplier}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.1 }}
                className={`text-7xl md:text-9xl font-bold ${getMultiplierColor()} z-10`}
              >
                {game.multiplier.toFixed(2)}x
              </motion.div>

              {/* Status text */}
              <div className="mt-4 text-lg text-muted-foreground z-10">
                {game.phase === "waiting" && "Place your bet to start"}
                {game.phase === "flying" && "Click to cash out!"}
                {game.phase === "crashed" && "Crashed! Better luck next time."}
                {game.phase === "cashedout" && `Cashed out at ${game.cashoutMultiplier?.toFixed(2)}x`}
              </div>

              {/* Rocket animation */}
              <AnimatePresence>
                {game.phase === "flying" && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ 
                      y: -100 - (game.multiplier - 1) * 20,
                      x: Math.sin(game.multiplier * 2) * 20,
                      rotate: -45 + Math.sin(game.multiplier) * 5,
                    }}
                    exit={{ y: 200, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.1 }}
                    className="absolute bottom-20 text-6xl"
                  >
                    🚀
                  </motion.div>
                )}
                {game.phase === "crashed" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute text-8xl"
                  >
                    💥
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trail effect */}
              {game.phase === "flying" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-t from-warning/50 to-transparent" 
                  style={{ height: `${Math.min((game.multiplier - 1) * 50, 200)}px` }} 
                />
              )}
            </div>

            {/* Game history */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
              <History className="w-4 h-4 text-muted-foreground shrink-0" />
              {gameHistory.map((h, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${
                    h.won 
                      ? "bg-success/20 text-success" 
                      : h.crashPoint >= 2 
                        ? "bg-muted text-muted-foreground"
                        : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {h.crashPoint.toFixed(2)}x
                </span>
              ))}
              {gameHistory.length === 0 && (
                <span className="text-sm text-muted-foreground">No games yet</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Balance */}
            <div className="card-casino p-4">
              <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
              <CurrencyDisplay amount={balance} size="xl" />
            </div>

            {/* Bet controls */}
            <div className="card-casino p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Bet Amount (F$)
                </label>
                <Input
                  type="number"
                  value={betInput}
                  onChange={(e) => setBetInput(e.target.value)}
                  min="1"
                  disabled={game.phase === "flying"}
                  className="font-mono text-lg"
                />
                <div className="flex gap-2 mt-2">
                  {[10, 50, 100, 500].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetInput(amt.toString())}
                      disabled={game.phase === "flying"}
                      className="flex-1"
                    >
                      {amt}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Auto Cashout (optional)
                </label>
                <Input
                  type="number"
                  value={autoCashout}
                  onChange={(e) => setAutoCashout(e.target.value)}
                  placeholder="e.g. 2.00"
                  step="0.1"
                  min="1.01"
                  disabled={game.phase === "flying"}
                  className="font-mono"
                />
              </div>

              {/* Action button */}
              {game.phase === "waiting" && (
                <Button
                  variant="casino"
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleBet}
                  disabled={isLoading || !session}
                >
                  <Zap className="w-5 h-5" />
                  {isLoading ? "Starting..." : "Place Bet"}
                </Button>
              )}

              {game.phase === "flying" && (
                <Button
                  variant="success"
                  size="lg"
                  className="w-full gap-2 animate-pulse"
                  onClick={handleCashout}
                >
                  <TrendingUp className="w-5 h-5" />
                  Cash Out ({(game.betAmount * game.multiplier).toFixed(2)} F$)
                </Button>
              )}

              {(game.phase === "crashed" || game.phase === "cashedout") && (
                <div className="space-y-3">
                  {game.phase === "cashedout" && game.payout && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                      <p className="text-success font-medium">You won!</p>
                      <CurrencyDisplay amount={game.payout} size="xl" className="text-success" />
                    </div>
                  )}
                  {game.phase === "crashed" && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                      <p className="text-destructive font-medium">Crashed at {game.multiplier.toFixed(2)}x</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You lost <CurrencyDisplay amount={game.betAmount} className="inline" />
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={resetGame}
                  >
                    Play Again
                  </Button>
                </div>
              )}

              {!session && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Please sign in to play
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="card-casino p-4">
              <h3 className="font-medium text-foreground mb-2">How to Play</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Place your bet before the round starts</li>
                <li>• Watch the multiplier increase</li>
                <li>• Cash out before the rocket crashes!</li>
                <li>• The longer you wait, the higher the risk</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}