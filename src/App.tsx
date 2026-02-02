import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Coinflip from "./pages/Coinflip";
import Mines from "./pages/Mines";
import Wallet from "./pages/Wallet";
import ProvablyFair from "./pages/ProvablyFair";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Geoblock from "./pages/Geoblock";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/coinflip" element={<Coinflip />} />
          <Route path="/mines" element={<Mines />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/provably-fair" element={<ProvablyFair />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/geoblock" element={<Geoblock />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
