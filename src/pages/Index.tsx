import { motion } from "framer-motion";
import { Coins, Bomb, Sparkles, Zap, Rocket } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/games/GameCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Provably Fair Gaming
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-foreground">Play. Win. </span>
            <span className="text-gradient-primary">Flip.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            The ultimate casino experience with instant payouts, provably fair games, 
            and the best odds in the game.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/coinflip">
              <Button variant="casino" size="lg" className="gap-2">
                <Zap className="w-5 h-5" />
                Start Playing
              </Button>
            </Link>
            <Link to="/provably-fair">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12"
        >
          {[
            { label: "Total Wagered", value: "F$2.4M+" },
            { label: "Active Players", value: "1,234" },
            { label: "Games Played", value: "89K+" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-2xl font-bold currency text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Games Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Games</h2>
          <span className="text-sm text-muted-foreground">3 available</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GameCard
              title="Coinflip"
              description="Pick heads or tails, double your money. Simple, fast, and thrilling."
              icon={Coins}
              href="/coinflip"
              accentColor="primary"
              players={127}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <GameCard
              title="Crash"
              description="Watch the multiplier rise and cash out before it crashes!"
              icon={Rocket}
              href="/crash"
              accentColor="warning"
              players={203}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GameCard
              title="Mines"
              description="Navigate the minefield. The more you reveal, the bigger your multiplier."
              icon={Bomb}
              href="/mines"
              accentColor="secondary"
              players={89}
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: "🔒",
              title: "Provably Fair",
              description: "Verify every game outcome with cryptographic proof",
            },
            {
              icon: "⚡",
              title: "Instant Payouts",
              description: "Winnings credited to your wallet immediately",
            },
            {
              icon: "💎",
              title: "Best Odds",
              description: "Industry-leading house edge for maximum wins",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl bg-muted/20 border border-border/30 text-center"
            >
              <span className="text-4xl mb-4 block">{feature.icon}</span>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </MainLayout>
  );
};

export default Index;
