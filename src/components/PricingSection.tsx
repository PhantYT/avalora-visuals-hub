import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import productRelease from "@/assets/product-release.jpg";
import productBeta from "@/assets/product-beta.jpg";
import { PurchaseDialog } from "./PurchaseDialog";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_beta: boolean;
  features: string[];
}

interface PricingTier {
  id: string;
  product_id: string;
  duration_type: string;
  price: number;
  duration_days: number | null;
}

export const PricingSection = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .order("is_beta", { ascending: true });

      const { data: tiersData } = await supabase
        .from("pricing_tiers")
        .select("*");

      setProducts(productsData || []);
      setPricingTiers(tiersData || []);
      setLoading(false);
    };

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePurchaseClick = (product: Product) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSelectedProduct(product);
    setPurchaseDialogOpen(true);
  };

  const getProductTiers = (productId: string) => {
    return pricingTiers
      .filter(tier => tier.product_id === productId)
      .sort((a, b) => {
        const order = { 'week': 1, 'month': 2, 'lifetime': 3 };
        return (order[a.duration_type as keyof typeof order] || 0) - (order[b.duration_type as keyof typeof order] || 0);
      });
  };

  if (loading) {
    return (
      <section className="py-24 px-4">
        <div className="container mx-auto flex justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Выберите свой план
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Получите доступ к невероятным визуальным эффектам
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {products.map((product, index) => {
            const tiers = getProductTiers(product.id);
            const Icon = product.is_beta ? Sparkles : Zap;
            const productImage = product.is_beta ? productBeta : productRelease;
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card 
                  className={`bg-gradient-card border-2 ${
                    product.is_beta 
                      ? 'border-accent/40 shadow-[0_0_40px_rgba(236,72,153,0.3)]' 
                      : 'border-primary/40 shadow-glow'
                  } relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
                >
                  {/* Product Image */}
                  <div className="relative h-40 overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${productImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                  </div>

                  {product.is_beta && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-accent/90 text-white border-0 shadow-neon">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Эксклюзив
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="inline-flex p-2 rounded-xl bg-primary/10 mb-3 w-fit">
                      <Icon className={`w-6 h-6 ${product.is_beta ? 'text-accent' : 'text-primary'}`} />
                    </div>
                    <CardTitle className="text-2xl mb-2">{product.name}</CardTitle>
                    <CardDescription className="text-sm">{product.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="space-y-2">
                      {product.features.map((feature, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground/80">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Purchase Button */}
                    <div className="pt-3 border-t border-primary/20">
                      <Button 
                        onClick={() => handlePurchaseClick(product)}
                        className={`w-full ${
                          product.is_beta 
                            ? 'bg-accent hover:bg-accent/90' 
                            : 'bg-primary hover:bg-primary/90'
                        } shadow-glow transition-all duration-300`}
                      >
                        Купить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {selectedProduct && (
          <PurchaseDialog
            open={purchaseDialogOpen}
            onOpenChange={setPurchaseDialogOpen}
            productName={selectedProduct.name}
            tiers={getProductTiers(selectedProduct.id)}
          />
        )}
      </div>
    </section>
  );
};