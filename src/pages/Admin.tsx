import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings,
  FileText,
  Check,
  X,
  Search,
  Percent,
  Clock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyDisplay } from "@/components/ui/currency-display";

interface DepositRequest {
  id: string;
  username: string;
  amount: number;
  method: string;
  reference: string;
  timestamp: Date;
  status: "pending" | "approved" | "denied";
}

interface WithdrawRequest {
  id: string;
  username: string;
  amount: number;
  address: string;
  timestamp: Date;
  status: "pending" | "approved" | "denied";
}

const mockDeposits: DepositRequest[] = [
  {
    id: "d1",
    username: "CryptoKing",
    amount: 500,
    method: "Game Currency",
    reference: "TXN123456789",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: "pending",
  },
  {
    id: "d2",
    username: "LuckyAce",
    amount: 1000,
    method: "Crypto",
    reference: "0x1234...5678",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    status: "pending",
  },
];

const mockWithdrawals: WithdrawRequest[] = [
  {
    id: "w1",
    username: "HighRoller",
    amount: 750,
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    status: "pending",
  },
];

export default function Admin() {
  const [userSearch, setUserSearch] = useState("");
  const [globalEdge, setGlobalEdge] = useState("2.0");
  const [coinflipEdge, setCoinflipEdge] = useState("2.0");
  const [minesEdge, setMinesEdge] = useState("2.0");

  return (
    <MainLayout showLiveFeed={false}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-warning/10">
            <Shield className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage VersFlip operations</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Deposits", value: mockDeposits.length, icon: ArrowDownCircle, color: "success" },
            { label: "Pending Withdrawals", value: mockWithdrawals.length, icon: ArrowUpCircle, color: "warning" },
            { label: "Active Users", value: 234, icon: Users, color: "primary" },
            { label: "Today's Revenue", value: "F$1,234", icon: Percent, color: "secondary" },
          ].map((stat, i) => (
            <div key={i} className="card-casino p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="deposits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="edge">House Edge</TabsTrigger>
            <TabsTrigger value="logs">Audit Log</TabsTrigger>
          </TabsList>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <div className="card-casino p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-success" />
                Pending Deposit Requests
              </h3>

              <div className="space-y-3">
                {mockDeposits.map((deposit) => (
                  <motion.div
                    key={deposit.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{deposit.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {deposit.method} • {deposit.reference}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {deposit.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <CurrencyDisplay amount={deposit.amount} size="lg" className="text-success" />
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" className="gap-1">
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-1">
                          <X className="w-4 h-4" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {mockDeposits.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No pending deposit requests
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <div className="card-casino p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-warning" />
                Pending Withdrawal Requests
              </h3>

              <div className="space-y-3">
                {mockWithdrawals.map((withdrawal) => (
                  <motion.div
                    key={withdrawal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{withdrawal.username}</p>
                      <p className="text-sm text-muted-foreground font-mono truncate max-w-xs">
                        {withdrawal.address}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {withdrawal.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <CurrencyDisplay amount={withdrawal.amount} size="lg" className="text-warning" />
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" className="gap-1">
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-1">
                          <X className="w-4 h-4" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="card-casino p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by username or email..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">Search</Button>
              </div>

              <div className="text-center text-muted-foreground py-8">
                Enter a username or email to search for users
              </div>
            </div>
          </TabsContent>

          {/* House Edge Tab */}
          <TabsContent value="edge">
            <div className="card-casino p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                House Edge Configuration
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Global Default (%)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={globalEdge}
                      onChange={(e) => setGlobalEdge(e.target.value)}
                      step="0.1"
                      min="0"
                      max="10"
                      className="font-mono"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Coinflip Override (%)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={coinflipEdge}
                      onChange={(e) => setCoinflipEdge(e.target.value)}
                      step="0.1"
                      min="0"
                      max="10"
                      className="font-mono"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Mines Override (%)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={minesEdge}
                      onChange={(e) => setMinesEdge(e.target.value)}
                      step="0.1"
                      min="0"
                      max="10"
                      className="font-mono"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  ⚠️ Changes will take effect immediately for new bets. All changes are logged.
                </p>
                <Button variant="casino" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Apply Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="logs">
            <div className="card-casino p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Audit Log
              </h3>

              <div className="space-y-2">
                {[
                  { action: "House edge updated", details: "Coinflip: 2.0% → 2.5%", admin: "admin@versflip.com", time: "5 min ago" },
                  { action: "Withdrawal approved", details: "HighRoller - F$500", admin: "admin@versflip.com", time: "1 hour ago" },
                  { action: "Deposit approved", details: "LuckyAce - F$1,000", admin: "admin@versflip.com", time: "2 hours ago" },
                  { action: "User banned", details: "BadActor123", admin: "admin@versflip.com", time: "1 day ago" },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{log.action}</p>
                      <p className="text-muted-foreground">{log.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">{log.admin}</p>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
