import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bomb, Gem, RotateCcw, TrendingUp, Settings2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CurrencyDisplay } from "@/components/ui/currency-display";

type CellState = "hidden" | "gem" | "mine";
type GameState = "betting" | "playing" | "won" | "lost";

const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

export default function Mines() {
  const [betAmount, setBetAmount] = useState<string>("10");
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [grid, setGrid] = useState<CellState[]>(Array(TOTAL_CELLS).fill("hidden"));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  
  const balance = 1250.50;
  const houseEdge = 0.02;

  // Calculate multiplier based on revealed tiles and mine count
  const calculateMultiplier = useCallback((revealed: number, mines: number) => {
    if (revealed === 0) return 1;
    const safeSpots = TOTAL_CELLS - mines;
    let multiplier = 1;
    for (let i = 0; i < revealed; i++) {
      multiplier *= (safeSpots - i) / (TOTAL_CELLS - mines - i);
    }
    return (1 / multiplier) * (1 - houseEdge);
  }, []);

  const currentMultiplier = calculateMultiplier(revealedCount, mineCount);
  const nextMultiplier = calculateMultiplier(revealedCount + 1, mineCount);
  const potentialWin = parseFloat(betAmount || "0") * currentMultiplier;

  const startGame = () => {
    // Generate mine positions
    const positions: number[] = [];
    while (positions.length < mineCount) {
      const pos = Math.floor(Math.random() * TOTAL_CELLS);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    setMinePositions(positions);
    setGrid(Array(TOTAL_CELLS).fill("hidden"));
    setRevealedCount(0);
    setGameState("playing");
  };

  const revealCell = (index: number) => {
    if (gameState !== "playing" || grid[index] !== "hidden") return;

    const newGrid = [...grid];
    const isMine = minePositions.includes(index);

    if (isMine) {
      // Reveal all mines
      newGrid[index] = "mine";
      minePositions.forEach((pos) => {
        newGrid[pos] = "mine";
      });
      setGrid(newGrid);
      setGameState("lost");
    } else {
      newGrid[index] = "gem";
      setGrid(newGrid);
      setRevealedCount((prev) => prev + 1);

      // Check if all safe tiles revealed
      if (revealedCount + 1 === TOTAL_CELLS - mineCount) {
        setGameState("won");
      }
    }
  };

  const cashOut = () => {
    if (gameState !== "playing" || revealedCount === 0) return;
    setGameState("won");
    // Reveal all mines on cashout
    const newGrid = [...grid];
    minePositions.forEach((pos) => {
      if (newGrid[pos] === "hidden") {
        newGrid[pos] = "mine";
      }
    });
    setGrid(newGrid);
  };

  const resetGame = () => {
    setGameState("betting");
    setGrid(Array(TOTAL_CELLS).fill("hidden"));
    setMinePositions([]);
    setRevealedCount(0);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-warning/10">
            <Bomb className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mines</h1>
            <p className="text-muted-foreground">
              Reveal gems, avoid mines. Cash out anytime!
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          {/* Game Grid */}
          <div className="card-casino p-6">
            <div
              className="grid gap-2 mb-6 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                maxWidth: "400px",
              }}
            >
              {grid.map((cell, index) => (
                <motion.button
                  key={index}
                  whileHover={
                    gameState === "playing" && cell === "hidden"
                      ? { scale: 1.05 }
                      : {}
                  }
                  whileTap={
                    gameState === "playing" && cell === "hidden"
                      ? { scale: 0.95 }
                      : {}
                  }
                  onClick={() => revealCell(index)}
                  disabled={gameState !== "playing" || cell !== "hidden"}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                    cell === "hidden"
                      ? "bg-muted border-border hover:border-primary/50 hover:bg-muted/80 cursor-pointer"
                      : cell === "gem"
                      ? "bg-success/20 border-success"
                      : "bg-destructive/20 border-destructive"
                  } ${gameState !== "playing" && cell === "hidden" ? "opacity-50" : ""}`}
                >
                  <AnimatePresence mode="wait">
                    {cell === "gem" && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-success"
                      >
                        <Gem className="w-6 h-6" />
                      </motion.div>
                    )}
                    {cell === "mine" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-destructive"
                      >
                        <Bomb className="w-6 h-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Result Message */}
            <AnimatePresence>
              {(gameState === "won" || gameState === "lost") && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p
                    className={`text-2xl font-bold mb-2 ${
                      gameState === "won" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {gameState === "won" ? "You Won!" : "Boom! Game Over"}
                  </p>
                  <CurrencyDisplay
                    amount={
                      gameState === "won"
                        ? potentialWin - parseFloat(betAmount)
                        : -parseFloat(betAmount)
                    }
                    size="lg"
                    showSign
                  />
                  <Button
                    variant="casino"
                    size="lg"
                    onClick={resetGame}
                    className="mt-4 gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Multiplier Display */}
            <div className="card-casino p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Current Multiplier
                </span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <p className="text-3xl font-bold currency text-foreground">
                {currentMultiplier.toFixed(2)}x
              </p>
              {gameState === "playing" && (
                <p className="text-sm text-muted-foreground mt-1">
                  Next: {nextMultiplier.toFixed(2)}x
                </p>
              )}
            </div>

            {/* Potential Win */}
            <div className="card-casino p-4">
              <span className="text-sm text-muted-foreground">
                {gameState === "playing" ? "Current Value" : "Potential Win"}
              </span>
              <CurrencyDisplay
                amount={potentialWin}
                size="lg"
                className="block mt-1 text-success"
              />
            </div>

            {gameState === "betting" ? (
              <>
                {/* Bet Amount */}
                <div className="card-casino p-4 space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Bet Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                      F$
                    </span>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="pl-10 font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        setBetAmount((parseFloat(betAmount) / 2).toFixed(2))
                      }
                    >
                      ½
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        setBetAmount((parseFloat(betAmount) * 2).toFixed(2))
                      }
                    >
                      2×
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setBetAmount(balance.toFixed(2))}
                    >
                      Max
                    </Button>
                  </div>
                </div>

                {/* Mine Count */}
                <div className="card-casino p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Mines
                    </label>
                    <span className="text-lg font-bold text-warning">
                      {mineCount}
                    </span>
                  </div>
                  <Slider
                    value={[mineCount]}
                    onValueChange={([value]) => setMineCount(value)}
                    min={1}
                    max={24}
                    step={1}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    More mines = higher risk & reward
                  </p>
                </div>

                {/* Start Button */}
                <Button
                  variant="casino"
                  size="lg"
                  className="w-full"
                  onClick={startGame}
                  disabled={!betAmount || parseFloat(betAmount) <= 0}
                >
                  Start Game
                </Button>
              </>
            ) : gameState === "playing" ? (
              <>
                {/* Game Info */}
                <div className="card-casino p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bet</span>
                    <CurrencyDisplay amount={parseFloat(betAmount)} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mines</span>
                    <span className="font-mono text-warning">{mineCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gems Found</span>
                    <span className="font-mono text-success">{revealedCount}</span>
                  </div>
                </div>

                {/* Cash Out Button */}
                <Button
                  variant="success"
                  size="lg"
                  className="w-full"
                  onClick={cashOut}
                  disabled={revealedCount === 0}
                >
                  Cash Out
                  <CurrencyDisplay
                    amount={potentialWin}
                    className="ml-2"
                  />
                </Button>
              </>
            ) : null}

            {/* Balance */}
            <div className="text-center text-sm text-muted-foreground">
              Balance: <CurrencyDisplay amount={balance} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
