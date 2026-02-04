import { useState, useEffect } from "react";
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
  UserPlus,
  Loader2,
  Crown,
  Gift,
  Star,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  balance: number;
  roles: string[];
  account_type?: string;
}

interface DepositRequest {
  id: string;
  user_id: string;
  amount: number | null;
  method: string;
  reference: string | null;
  voucher_code: string | null;
  created_at: string;
  status: string;
  profiles?: { username: string };
}

interface WithdrawRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  destination: string;
  created_at: string;
  status: string;
  profiles?: { username: string };
}

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  profiles?: { username: string };
}

export default function Admin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // House edge state
  const [currentEdges, setCurrentEdges] = useState<Record<string, number>>({});
  const [globalEdge, setGlobalEdge] = useState("2.0");
  const [coinflipEdge, setCoinflipEdge] = useState("2.0");
  const [minesEdge, setMinesEdge] = useState("2.0");
  const [crashEdge, setCrashEdge] = useState("4.0");

  // Create user state
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserAccountType, setNewUserAccountType] = useState("standard");

  // Fetch data on mount
  useEffect(() => {
    fetchDeposits();
    fetchWithdrawals();
    fetchHouseEdge();
    fetchAuditLogs();
  }, []);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin/deposits');
      if (!error && data?.deposits) {
        setDeposits(data.deposits);
      }
    } catch (err) {
      console.error('Error fetching deposits:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin/withdrawals');
      if (!error && data?.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin/users', {
        body: {},
        method: 'GET',
      });
      if (!error && data?.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    setIsLoading(false);
  };

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(`admin/users?search=${encodeURIComponent(userSearch)}`, {
        method: 'GET',
      });
      if (!error && data?.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
    setIsLoading(false);
  };

  const fetchHouseEdge = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin/house-edge', {
        method: 'GET',
      });
      if (!error && data?.current) {
        setCurrentEdges(data.current);
        setGlobalEdge((data.current.GLOBAL * 100).toFixed(1));
        setCoinflipEdge((data.current.COINFLIP * 100).toFixed(1));
        setMinesEdge((data.current.MINES * 100).toFixed(1));
        setCrashEdge(((data.current.CRASH || 0.04) * 100).toFixed(1));
      }
    } catch (err) {
      console.error('Error fetching house edge:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin/audit-logs', {
        method: 'GET',
      });
      if (!error && data?.logs) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const handleReviewDeposit = async (depositId: string, approved: boolean, amount?: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin/review-deposit', {
        body: { depositId, approved, amount }
      });
      if (error) throw error;
      toast({ title: `Deposit ${approved ? 'approved' : 'denied'}` });
      fetchDeposits();
      fetchAuditLogs();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to review deposit', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleReviewWithdrawal = async (withdrawalId: string, approved: boolean) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin/review-withdrawal', {
        body: { withdrawalId, approved }
      });
      if (error) throw error;
      toast({ title: `Withdrawal ${approved ? 'approved' : 'denied'}` });
      fetchWithdrawals();
      fetchAuditLogs();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to review withdrawal', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleUpdateHouseEdge = async (gameKey: string, edgePercent: string) => {
    setIsLoading(true);
    try {
      const edge = parseFloat(edgePercent) / 100;
      const { data, error } = await supabase.functions.invoke('admin/house-edge', {
        body: { gameKey, edgePercent: edge }
      });
      if (error) throw error;
      toast({ title: `${gameKey} house edge updated to ${edgePercent}%` });
      fetchHouseEdge();
      fetchAuditLogs();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to update house edge', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserUsername) {
      toast({ title: 'All fields required', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin/create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          username: newUserUsername,
          accountType: newUserAccountType
        }
      });
      if (error) throw error;
      toast({ title: `User ${newUserUsername} created successfully` });
      setCreateUserOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserUsername("");
      setNewUserAccountType("standard");
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to create user', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handlePromoteAdmin = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin/promote-admin', {
        body: { targetUserId: userId }
      });
      if (error) throw error;
      toast({ title: 'User promoted to admin' });
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to promote user', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const getAccountTypeIcon = (type?: string) => {
    switch (type) {
      case 'promotional': return <Gift className="w-4 h-4 text-warning" />;
      case 'vip': return <Star className="w-4 h-4 text-primary" />;
      default: return null;
    }
  };

  const getAccountTypeBadge = (type?: string) => {
    switch (type) {
      case 'promotional': 
        return <span className="px-2 py-0.5 text-xs rounded-full bg-warning/20 text-warning">Promo</span>;
      case 'vip': 
        return <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">VIP</span>;
      default: 
        return <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">Standard</span>;
    }
  };

  return (
    <MainLayout showLiveFeed={false}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10">
              <Shield className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage VersFlip operations</p>
            </div>
          </div>
          
          <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogTrigger asChild>
              <Button variant="casino" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Email</label>
                  <Input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Username</label>
                  <Input
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Password</label>
                  <Input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Account Type</label>
                  <Select value={newUserAccountType} onValueChange={setNewUserAccountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Standard
                        </div>
                      </SelectItem>
                      <SelectItem value="promotional">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-warning" />
                          Promotional (F$1000 play money)
                        </div>
                      </SelectItem>
                      <SelectItem value="vip">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-primary" />
                          VIP
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Promotional accounts have play money that cannot be withdrawn.
                  </p>
                </div>
                <Button onClick={handleCreateUser} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Deposits", value: deposits.length, icon: ArrowDownCircle, color: "success" },
            { label: "Pending Withdrawals", value: withdrawals.length, icon: ArrowUpCircle, color: "warning" },
            { label: "Total Users", value: users.length || "—", icon: Users, color: "primary" },
            { label: "House Edge", value: `${(currentEdges.GLOBAL || 0.015) * 100}%`, icon: Percent, color: "secondary" },
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
            <TabsTrigger value="users" onClick={() => users.length === 0 && fetchUsers()}>Users</TabsTrigger>
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
                {deposits.map((deposit) => (
                  <motion.div
                    key={deposit.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {deposit.profiles?.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {deposit.method} • {deposit.reference || deposit.voucher_code || 'No reference'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(deposit.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {deposit.amount ? (
                        <CurrencyDisplay amount={deposit.amount} size="lg" className="text-success" />
                      ) : (
                        <span className="text-muted-foreground">Amount TBD</span>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleReviewDeposit(deposit.id, true, deposit.amount || undefined)}
                          disabled={isLoading}
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleReviewDeposit(deposit.id, false)}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {deposits.length === 0 && (
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
                {withdrawals.map((withdrawal) => (
                  <motion.div
                    key={withdrawal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {withdrawal.profiles?.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono truncate max-w-xs">
                        {withdrawal.destination}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <CurrencyDisplay amount={withdrawal.amount} size="lg" className="text-warning" />
                      <div className="flex gap-2">
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleReviewWithdrawal(withdrawal.id, true)}
                          disabled={isLoading}
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleReviewWithdrawal(withdrawal.id, false)}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {withdrawals.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No pending withdrawal requests
                  </p>
                )}
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
                    placeholder="Search users by username..."
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  />
                </div>
                <Button variant="outline" onClick={searchUsers} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
                <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
                  Load All
                </Button>
              </div>

              {users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {user.roles.includes('admin') ? (
                            <Crown className="w-5 h-5 text-warning" />
                          ) : (
                            <span className="text-primary font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.username}</p>
                            {user.roles.includes('admin') && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-warning/20 text-warning">Admin</span>
                            )}
                            {getAccountTypeBadge(user.account_type)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <CurrencyDisplay amount={user.balance} size="lg" />
                        {!user.roles.includes('admin') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePromoteAdmin(user.user_id)}
                            disabled={isLoading}
                          >
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Click "Load All" or search for users
                </p>
              )}
            </div>
          </TabsContent>

          {/* House Edge Tab */}
          <TabsContent value="edge">
            <div className="card-casino p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                House Edge Configuration
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      max="50"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateHouseEdge('GLOBAL', globalEdge)}
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Coinflip (%)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={coinflipEdge}
                      onChange={(e) => setCoinflipEdge(e.target.value)}
                      step="0.1"
                      min="0"
                      max="50"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateHouseEdge('COINFLIP', coinflipEdge)}
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Mines (%)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={minesEdge}
                      onChange={(e) => setMinesEdge(e.target.value)}
                      step="0.1"
                      min="0"
                      max="50"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateHouseEdge('MINES', minesEdge)}
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Crash (%)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={crashEdge}
                      onChange={(e) => setCrashEdge(e.target.value)}
                      step="0.1"
                      min="0"
                      max="50"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateHouseEdge('CRASH', crashEdge)}
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Changes take effect immediately for new bets. All changes are logged in the audit log.
                </p>
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

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{log.action}</p>
                      <p className="text-muted-foreground">
                        {log.target_type} {log.target_id ? `• ${log.target_id.slice(0, 8)}...` : ''}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span className="text-xs ml-2">
                            {JSON.stringify(log.details).slice(0, 50)}...
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">{log.profiles?.username || 'System'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No audit logs yet
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}