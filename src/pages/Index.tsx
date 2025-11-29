import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { VideoShowcase } from "@/components/VideoShowcase";
import { SocialLinks } from "@/components/SocialLinks";
import { PricingSection } from "@/components/PricingSection";
import { Parallax3D } from "@/components/Parallax3D";

const Index = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <Hero />
      <Features />
      <PricingSection />
      <Parallax3D />
      <VideoShowcase />
      <SocialLinks />
    </div>
  );
};

export default Index;
