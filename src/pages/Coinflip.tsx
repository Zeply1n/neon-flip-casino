import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CoinSide = 'heads' | 'tails';
interface GameResult { won: boolean; result: CoinSide; payout: number; multiplier: number; }

export default function Coinflip() {
  const { balance, refreshBalance } = useAuth();
  const [betAmount, setBetAmount] = useState(10);
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [flipResult, setFlipResult] = useState<CoinSide | null>(null);

  const handleFlip = async () => {
    if (!selectedSide || betAmount <= 0 || betAmount > balance) { toast.error('Select a side and enter valid bet'); return; }
    setIsFlipping(true); setGameResult(null); setFlipResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('coinflip-game', { body: { betAmount, chosenSide: selectedSide } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      await new Promise(r => setTimeout(r, 1500));
      setFlipResult(data.result);
      setGameResult({ won: data.won, result: data.result, payout: data.payout, multiplier: data.multiplier });
      await refreshBalance();
      toast[data.won ? 'success' : 'error'](data.won ? `🎉 Won ${data.payout.toFixed(2)} F$!` : 'Better luck next time!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setIsFlipping(false); }
  };

  const resetGame = () => { setGameResult(null); setFlipResult(null); setSelectedSide(null); };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-warning-glow flex items-center justify-center shadow-lg shadow-warning/30">
            <Coins className="w-6 h-6 text-warning-foreground" />
          </div>
          <div><h1 className="text-2xl font-bold">Coinflip</h1><p className="text-muted-foreground text-sm">Pick heads or tails</p></div>
        </div>
        <div className="card-casino p-8">
          <div className="flex justify-center mb-8">
            <motion.div animate={isFlipping ? { rotateY: [0, 1800], scale: [1, 1.2, 1] } : flipResult ? { rotateY: flipResult === 'heads' ? 0 : 180 } : {}} transition={{ duration: 1.5 }} className="relative w-32 h-32" style={{ transformStyle: 'preserve-3d' }}>
              <div className={`absolute inset-0 rounded-full flex items-center justify-center text-4xl font-bold border-4 ${flipResult === 'heads' ? 'bg-warning text-warning-foreground border-warning-glow' : 'bg-muted text-muted-foreground border-border'}`} style={{ backfaceVisibility: 'hidden' }}>H</div>
              <div className={`absolute inset-0 rounded-full flex items-center justify-center text-4xl font-bold border-4 ${flipResult === 'tails' ? 'bg-primary text-primary-foreground border-primary-glow' : 'bg-muted text-muted-foreground border-border'}`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>T</div>
            </motion.div>
          </div>
          <AnimatePresence>
            {gameResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
                <div className={`p-4 rounded-lg ${gameResult.won ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'} border`}>
                  <p className={`text-lg font-bold ${gameResult.won ? 'text-success' : 'text-destructive'}`}>{gameResult.won ? '🎉 You Won!' : 'You Lost!'}</p>
                  {gameResult.won && <CurrencyDisplay amount={gameResult.payout} className="text-2xl font-bold text-success" />}
                </div>
                <Button variant="ghost" className="mt-4" onClick={resetGame}>Play Again</Button>
              </motion.div>
            )}
          </AnimatePresence>
          {!gameResult && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.button whileHover={{ scale: 1.02 }} onClick={() => setSelectedSide('heads')} disabled={isFlipping} className={`p-6 rounded-xl border-2 ${selectedSide === 'heads' ? 'border-warning bg-warning/10' : 'border-border hover:border-warning/50'}`}>
                  <div className="text-4xl mb-2">🪙</div><p className="font-bold">Heads</p><p className="text-sm text-muted-foreground">1.96x payout</p>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} onClick={() => setSelectedSide('tails')} disabled={isFlipping} className={`p-6 rounded-xl border-2 ${selectedSide === 'tails' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                  <div className="text-4xl mb-2">💰</div><p className="font-bold">Tails</p><p className="text-sm text-muted-foreground">1.96x payout</p>
                </motion.button>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2"><span className="text-sm text-muted-foreground">Bet Amount</span><span className="text-sm text-muted-foreground">Balance: <CurrencyDisplay amount={balance} /></span></div>
                <Input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={isFlipping} />
              </div>
              <Button variant="casino" size="lg" className="w-full gap-2" onClick={handleFlip} disabled={!selectedSide || isFlipping || betAmount <= 0 || betAmount > balance}>
                {isFlipping ? <><Loader2 className="w-5 h-5 animate-spin" />Flipping...</> : <><Coins className="w-5 h-5" />Flip for {betAmount} F$</>}
              </Button>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
