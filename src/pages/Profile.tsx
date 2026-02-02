import { useState } from "react";
import { motion } from "framer-motion";
import { User, Key, Shield, Settings, Save } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/ui/currency-display";

export default function Profile() {
  const [username, setUsername] = useState("Player123");
  const [email, setEmail] = useState("player@example.com");
  const [clientSeed, setClientSeed] = useState("my-custom-seed-123");

  // Mock stats
  const stats = {
    totalGames: 847,
    totalWins: 423,
    winRate: 49.9,
    totalWagered: 15420.0,
    totalProfit: 1250.5,
  };

  return (
    <MainLayout showLiveFeed={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-secondary/10">
            <User className="w-8 h-8 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          {/* Main Settings */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="card-casino p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Account Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Username
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your username"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Contact support to change your email
                  </p>
                </div>

                <Button variant="casino" className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Provably Fair Settings */}
            <div className="card-casino p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Provably Fair</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Client Seed
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={clientSeed}
                      onChange={(e) => setClientSeed(e.target.value)}
                      className="font-mono"
                      placeholder="Your custom seed"
                    />
                    <Button variant="casino">Update</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This seed is used to generate game outcomes
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-success" />
                    All games are provably fair and verifiable
                  </div>
                </div>
              </div>
            </div>

            {/* Responsible Gaming */}
            <div className="card-casino p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Responsible Gaming</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Daily Deposit Limit
                    </label>
                    <Input
                      type="number"
                      placeholder="No limit set"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Daily Loss Limit
                    </label>
                    <Input
                      type="number"
                      placeholder="No limit set"
                      className="font-mono"
                    />
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Set Limits
                </Button>

                <p className="text-xs text-muted-foreground">
                  Set responsible gaming limits to help manage your activity. 
                  Limits take 24 hours to reduce and are instant to increase.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-casino p-6"
            >
              <h3 className="font-semibold text-foreground mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Games</span>
                  <span className="font-mono font-medium text-foreground">
                    {stats.totalGames}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Wins</span>
                  <span className="font-mono font-medium text-success">
                    {stats.totalWins}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-mono font-medium text-foreground">
                    {stats.winRate}%
                  </span>
                </div>
                <div className="border-t border-border/50 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Total Wagered</span>
                    <CurrencyDisplay amount={stats.totalWagered} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Profit</span>
                    <CurrencyDisplay
                      amount={stats.totalProfit}
                      showSign
                      className={stats.totalProfit >= 0 ? "text-success" : "text-destructive"}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="card-casino p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Member since</p>
              <p className="font-medium text-foreground">January 2024</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
