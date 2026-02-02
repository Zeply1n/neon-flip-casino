import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, RefreshCw, Copy, Check, Hash, Key, Info } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ProvablyFair() {
  const [clientSeed, setClientSeed] = useState("my-custom-seed-123");
  const [verifyServerSeed, setVerifyServerSeed] = useState("");
  const [verifyClientSeed, setVerifyClientSeed] = useState("");
  const [verifyNonce, setVerifyNonce] = useState("");
  const [copied, setCopied] = useState(false);

  // Mock current seeds
  const serverSeedHash = "a7f3b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
  const currentNonce = 147;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rotateSeed = () => {
    // In real implementation, this would rotate the server seed
    alert("Server seed rotated! Previous seed revealed for verification.");
  };

  return (
    <MainLayout showLiveFeed={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-success/10">
            <Shield className="w-8 h-8 text-success" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Provably Fair</h1>
            <p className="text-muted-foreground">
              Verify every game outcome cryptographically
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="card-casino p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">How It Works</h3>
              <p className="text-sm text-muted-foreground">
                Our provably fair system ensures that neither the house nor the player 
                can predict or manipulate game outcomes. Each result is determined by 
                combining a server seed (hidden until revealed), your client seed, and 
                an incrementing nonce using HMAC-SHA256.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              {
                step: "1",
                title: "Server Seed Hash",
                description: "We publish a hash of the server seed before any bets",
              },
              {
                step: "2",
                title: "Your Client Seed",
                description: "You can set your own seed to influence outcomes",
              },
              {
                step: "3",
                title: "Verify Results",
                description: "After rotation, verify outcomes with revealed seeds",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                  {item.step}
                </div>
                <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="seeds" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="seeds">Active Seeds</TabsTrigger>
            <TabsTrigger value="verify">Verify Game</TabsTrigger>
          </TabsList>

          <TabsContent value="seeds" className="space-y-4">
            {/* Current Server Seed Hash */}
            <div className="card-casino p-6">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Server Seed Hash</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                This hash represents our current server seed. The actual seed will be 
                revealed when you rotate it.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all text-foreground">
                  {serverSeedHash}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(serverSeedHash)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Current Nonce: <span className="font-mono text-foreground">{currentNonce}</span>
                </span>
                <Button variant="outline" size="sm" onClick={rotateSeed} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Rotate Seed
                </Button>
              </div>
            </div>

            {/* Client Seed */}
            <div className="card-casino p-6">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Your Client Seed</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Change your client seed at any time. This is combined with our server 
                seed to generate outcomes.
              </p>
              <div className="flex gap-2">
                <Input
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  className="font-mono"
                  placeholder="Enter your custom seed"
                />
                <Button variant="casino">Update</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verify" className="space-y-4">
            <div className="card-casino p-6">
              <h3 className="font-semibold text-foreground mb-4">Verify a Game Result</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the seeds and nonce from a completed game to verify its outcome.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Server Seed (revealed)
                  </label>
                  <Input
                    value={verifyServerSeed}
                    onChange={(e) => setVerifyServerSeed(e.target.value)}
                    className="font-mono"
                    placeholder="Enter the revealed server seed"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Client Seed
                  </label>
                  <Input
                    value={verifyClientSeed}
                    onChange={(e) => setVerifyClientSeed(e.target.value)}
                    className="font-mono"
                    placeholder="Enter your client seed"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Nonce
                  </label>
                  <Input
                    type="number"
                    value={verifyNonce}
                    onChange={(e) => setVerifyNonce(e.target.value)}
                    className="font-mono"
                    placeholder="Enter the game nonce"
                  />
                </div>

                <Button variant="casino" className="w-full" size="lg">
                  Verify Result
                </Button>
              </div>

              {/* Verification Result would appear here */}
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h3 className="font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible className="card-casino">
            <AccordionItem value="item-1" className="border-border/50">
              <AccordionTrigger className="px-4">
                What is provably fair gaming?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground">
                Provably fair is a cryptographic method that allows players to verify 
                that game outcomes were not manipulated. It uses hash functions to 
                commit to a result before the game, which can be verified afterward.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-border/50">
              <AccordionTrigger className="px-4">
                Why should I change my client seed?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground">
                Changing your client seed ensures that you have direct influence over 
                the outcome generation. It proves that the house cannot predetermine 
                results since they don't know your seed until you place your bet.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-border/50">
              <AccordionTrigger className="px-4">
                How do I verify a past game?
              </AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground">
                After rotating your server seed, you'll receive the previously hidden 
                seed. Use the verification tool above with that seed, your client seed, 
                and the game's nonce to recalculate and verify the outcome.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </MainLayout>
  );
}
