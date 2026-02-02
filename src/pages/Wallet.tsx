import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Bitcoin,
  Gift,
  Gamepad2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyDisplay, BalanceCard } from "@/components/ui/currency-display";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "bet" | "win";
  amount: number;
  status: "completed" | "pending" | "failed";
  method?: string;
  timestamp: Date;
}

const mockTransactions: Transaction[] = [
  { id: "1", type: "win", amount: 85.5, status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: "2", type: "bet", amount: -50, status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 10) },
  { id: "3", type: "deposit", amount: 500, status: "completed", method: "Crypto", timestamp: new Date(Date.now() - 1000 * 60 * 60) },
  { id: "4", type: "withdrawal", amount: -200, status: "pending", method: "Crypto", timestamp: new Date(Date.now() - 1000 * 60 * 120) },
  { id: "5", type: "win", amount: 250, status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 180) },
  { id: "6", type: "bet", amount: -100, status: "completed", timestamp: new Date(Date.now() - 1000 * 60 * 200) },
];

const depositMethods = [
  {
    id: "crypto",
    name: "Crypto",
    description: "Bitcoin, Ethereum, USDT",
    icon: Bitcoin,
    color: "warning",
  },
  {
    id: "giftcard",
    name: "Gift Card",
    description: "Redeem voucher codes",
    icon: Gift,
    color: "secondary",
  },
  {
    id: "game",
    name: "Game Currency",
    description: "Transfer from games",
    icon: Gamepad2,
    color: "primary",
  },
];

export default function Wallet() {
  const [activeTab, setActiveTab] = useState("deposit");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  
  const balance = 1250.50;
  const lifetimeWager = 15420.00;
  const lifetimePnL = 1250.50;

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return <ArrowDownRight className="w-4 h-4 text-success" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-warning" />;
      case "bet":
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case "win":
        return <ArrowDownRight className="w-4 h-4 text-success" />;
    }
  };

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <MainLayout showLiveFeed={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <WalletIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground">Manage your F$ balance</p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <BalanceCard balance={balance} label="Available Balance" />
          <div className="card-casino p-6">
            <p className="text-sm text-muted-foreground mb-1">Lifetime Wagered</p>
            <CurrencyDisplay amount={lifetimeWager} size="xl" className="text-foreground" />
          </div>
          <div className="card-casino p-6">
            <p className="text-sm text-muted-foreground mb-1">Lifetime P&L</p>
            <CurrencyDisplay
              amount={lifetimePnL}
              size="xl"
              showSign
              className={lifetimePnL >= 0 ? "text-success" : "text-destructive"}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {depositMethods.map((method) => (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`card-casino p-6 text-left transition-all ${
                    selectedMethod === method.id
                      ? "border-primary/50 shadow-lg shadow-primary/20"
                      : "hover:border-border/80"
                  }`}
                >
                  <div className={`p-3 rounded-xl bg-${method.color}/10 w-fit mb-4`}>
                    <method.icon className={`w-6 h-6 text-${method.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </motion.button>
              ))}
            </div>

            {selectedMethod === "crypto" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-casino p-6"
              >
                <h3 className="font-semibold text-foreground mb-4">Crypto Deposit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send crypto to the address below. Your balance will be credited after confirmation.
                </p>
                <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                  bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum deposit: F$10 • Processing time: ~10 minutes
                </p>
              </motion.div>
            )}

            {selectedMethod === "giftcard" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-casino p-6"
              >
                <h3 className="font-semibold text-foreground mb-4">Redeem Voucher</h3>
                <div className="flex gap-2">
                  <Input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Enter voucher code"
                    className="font-mono"
                  />
                  <Button variant="casino">Redeem</Button>
                </div>
              </motion.div>
            )}

            {selectedMethod === "game" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-casino p-6"
              >
                <h3 className="font-semibold text-foreground mb-4">Game Currency Transfer</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your game transaction ID for manual review.
                </p>
                <div className="flex gap-2">
                  <Input placeholder="Transaction ID" className="font-mono" />
                  <Button variant="casino">Submit</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Processing time: Up to 24 hours
                </p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="withdraw">
            <div className="card-casino p-6">
              <h3 className="font-semibold text-foreground mb-4">Request Withdrawal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                      F$
                    </span>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="pl-10 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: <CurrencyDisplay amount={balance} />
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Withdrawal Address
                  </label>
                  <Input placeholder="Enter your crypto address" className="font-mono" />
                </div>

                <Button variant="casino" className="w-full" size="lg">
                  Submit Withdrawal Request
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Withdrawals are reviewed within 24 hours. One request per 24h.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <div className="card-casino p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {mockTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {tx.type}
                      {tx.method && <span className="text-muted-foreground"> • {tx.method}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CurrencyDisplay
                    amount={tx.amount}
                    showSign
                    className={tx.amount >= 0 ? "text-success" : "text-destructive"}
                  />
                  {getStatusIcon(tx.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
