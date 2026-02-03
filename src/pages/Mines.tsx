import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bomb, Gem, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { MainLayout } from "@/components/layout/MainLayout";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GameState {
  gameId: string;
  minesCount: number;
  betAmount: number;
  multiplier: number;
  revealedCount: number;
  revealedPositions: number[];
  minePositions?: number[];
  status: 'idle' | 'active' | 'won' | 'lost';
  potentialPayout: number;
}

export default function Mines() {
  const { balance, refreshBalance } = useAuth();
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [revealingTile, setRevealingTile] = useState<number | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    gameId: '', minesCount: 5, betAmount: 0, multiplier: 1,
    revealedCount: 0, revealedPositions: [], status: 'idle', potentialPayout: 0
  });

  const isPlaying = gameState.status === 'active';

  const startGame = async () => {
    if (betAmount <= 0 || betAmount > balance) { toast.error('Invalid bet amount'); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mines-game/start', { body: { betAmount, minesCount } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGameState({ gameId: data.gameId, minesCount: data.minesCount, betAmount: data.betAmount, multiplier: data.multiplier, revealedCount: 0, revealedPositions: [], status: 'active', potentialPayout: data.betAmount });
      await refreshBalance();
      toast.success('Game started!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to start'); } finally { setIsLoading(false); }
  };

  const revealTile = async (index: number) => {
    if (!isPlaying || gameState.revealedPositions.includes(index) || revealingTile !== null) return;
    setRevealingTile(index);
    try {
      const { data, error } = await supabase.functions.invoke('mines-game/reveal', { body: { gameId: gameState.gameId, tileIndex: index } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const newRevealed = [...gameState.revealedPositions, index];
      if (data.isMine) {
        setGameState(prev => ({ ...prev, revealedPositions: newRevealed, minePositions: data.minePositions, status: 'lost', multiplier: 0, potentialPayout: 0 }));
        await refreshBalance();
        toast.error('💣 BOOM!');
      } else if (data.autoWin) {
        setGameState(prev => ({ ...prev, revealedPositions: newRevealed, revealedCount: data.revealedCount, multiplier: data.multiplier, potentialPayout: data.payout, status: 'won' }));
        await refreshBalance();
        toast.success(`🎉 Won ${data.payout.toFixed(2)} F$!`);
      } else {
        setGameState(prev => ({ ...prev, revealedPositions: newRevealed, revealedCount: data.revealedCount, multiplier: data.multiplier, potentialPayout: data.potentialPayout }));
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setRevealingTile(null); }
  };

  const cashout = async () => {
    if (!isPlaying || gameState.revealedCount === 0) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mines-game/cashout', { body: { gameId: gameState.gameId } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGameState(prev => ({ ...prev, status: 'won', potentialPayout: data.payout }));
      await refreshBalance();
      toast.success(`💰 Cashed out ${data.payout.toFixed(2)} F$!`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setIsLoading(false); }
  };

  const resetGame = () => setGameState({ gameId: '', minesCount, betAmount: 0, multiplier: 1, revealedCount: 0, revealedPositions: [], status: 'idle', potentialPayout: 0 });

  const getTileClass = (index: number) => {
    const isRevealed = gameState.revealedPositions.includes(index);
    const isMine = gameState.minePositions?.includes(index);
    const isGameOver = gameState.status === 'won' || gameState.status === 'lost';
    if (isRevealed) return "bg-success/20 border-success/50";
    if (isGameOver && isMine) return "bg-destructive/20 border-destructive/50";
    if (isPlaying) return "bg-muted/50 border-border hover:border-primary/50 cursor-pointer";
    return "bg-muted/30 border-border/50";
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success-glow flex items-center justify-center shadow-lg shadow-success/30">
            <Bomb className="w-6 h-6 text-success-foreground" />
          </div>
          <div><h1 className="text-2xl font-bold text-foreground">Mines</h1><p className="text-muted-foreground text-sm">Avoid the bombs</p></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-casino p-6">
            {isPlaying && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xl font-bold text-primary">{gameState.multiplier.toFixed(2)}x</span>
                  <span className="text-muted-foreground">|</span>
                  <CurrencyDisplay amount={gameState.potentialPayout} className="text-lg font-bold text-success" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-5 gap-2 aspect-square max-w-md mx-auto">
              {Array.from({ length: 25 }).map((_, i) => (
                <motion.button key={i} whileHover={isPlaying && !gameState.revealedPositions.includes(i) ? { scale: 1.05 } : {}} onClick={() => revealTile(i)} disabled={!isPlaying || gameState.revealedPositions.includes(i)} className={`aspect-square rounded-lg border-2 flex items-center justify-center ${getTileClass(i)}`}>
                  {revealingTile === i ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : gameState.revealedPositions.includes(i) ? <Gem className="w-8 h-8 text-success" /> : (gameState.status !== 'idle' && gameState.minePositions?.includes(i)) ? <Bomb className="w-8 h-8 text-destructive" /> : null}
                </motion.button>
              ))}
            </div>
            {(gameState.status === 'won' || gameState.status === 'lost') && (
              <div className="mt-6 text-center">
                <div className={`p-4 rounded-lg ${gameState.status === 'won' ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'} border`}>
                  <p className={`text-lg font-bold ${gameState.status === 'won' ? 'text-success' : 'text-destructive'}`}>{gameState.status === 'won' ? '🎉 You Won!' : '💣 Game Over!'}</p>
                  {gameState.status === 'won' && <CurrencyDisplay amount={gameState.potentialPayout} className="text-2xl font-bold text-success" />}
                </div>
                <Button variant="casino" className="mt-4" onClick={resetGame}>Play Again</Button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card-casino p-4 space-y-4">
              <div><label className="text-sm text-muted-foreground">Balance</label><CurrencyDisplay amount={balance} className="text-2xl font-bold" /></div>
              <div><label className="text-sm text-muted-foreground">Bet Amount</label><Input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={isPlaying} /></div>
              <div><label className="text-sm text-muted-foreground">Mines: {minesCount}</label><Slider value={[minesCount]} onValueChange={([v]) => setMinesCount(v)} min={1} max={24} disabled={isPlaying} /></div>
              {!isPlaying ? (
                <Button variant="casino" size="lg" className="w-full" onClick={startGame} disabled={isLoading || betAmount <= 0 || betAmount > balance}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Play for ${betAmount} F$`}</Button>
              ) : (
                <Button variant="deposit" size="lg" className="w-full" onClick={cashout} disabled={isLoading || gameState.revealedCount === 0}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Cash Out ${gameState.potentialPayout.toFixed(2)} F$`}</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
