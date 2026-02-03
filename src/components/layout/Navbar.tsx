import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Coins, 
  Bomb, 
  Wallet, 
  User, 
  Menu,
  Shield,
  LogIn,
  LogOut,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CurrencyDisplay } from "@/components/ui/currency-display";

const navLinks = [
  { href: "/coinflip", label: "Coinflip", icon: Coins },
  { href: "/mines", label: "Mines", icon: Bomb },
];

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, balance, isLoading, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border/50 glass"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </motion.div>
          <span className="text-xl font-bold text-gradient-primary hidden sm:block">
            VersFlip
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant={isActive(link.href) ? "casino-outline" : "ghost"}
                className="gap-2"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            </Link>
          ))}
          <Link to="/provably-fair">
            <Button
              variant={isActive("/provably-fair") ? "casino-outline" : "ghost"}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Fair
            </Button>
          </Link>
        </nav>

        {/* Right Side - Balance & User */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              {/* Balance Display */}
              <Link to="/wallet">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-primary" />
                  <CurrencyDisplay amount={balance} className="font-medium" />
                </motion.div>
              </Link>

              {/* Deposit Button */}
              <Link to="/wallet" className="hidden sm:block">
                <Button variant="deposit" size="sm">
                  Deposit
                </Button>
              </Link>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.username || 'Player'}</p>
                    <CurrencyDisplay amount={balance} className="text-xs text-muted-foreground" />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="cursor-pointer">
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-warning">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="casino" className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-border">
              <nav className="flex flex-col gap-2 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive(link.href) ? "casino-outline" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <Link to="/provably-fair" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive("/provably-fair") ? "casino-outline" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Provably Fair
                  </Button>
                </Link>
                {user && (
                  <>
                    <Link to="/wallet" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={isActive("/wallet") ? "casino-outline" : "ghost"}
                        className="w-full justify-start gap-2"
                      >
                        <Wallet className="w-4 h-4" />
                        Wallet
                      </Button>
                    </Link>
                    <div className="my-4 border-t border-border" />
                    <Link to="/wallet" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="deposit" className="w-full">
                        Deposit
                      </Button>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
