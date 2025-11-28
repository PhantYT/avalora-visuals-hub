import { MessageCircle, Youtube, Twitter, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

const socialLinks = [
  {
    name: "Discord",
    icon: MessageCircle,
    url: "https://discord.gg",
    color: "hover:text-[#5865F2]",
    bgColor: "hover:bg-[#5865F2]/10",
  },
  {
    name: "YouTube",
    icon: Youtube,
    url: "https://youtube.com",
    color: "hover:text-[#FF0000]",
    bgColor: "hover:bg-[#FF0000]/10",
  },
  {
    name: "Twitter",
    icon: Twitter,
    url: "https://twitter.com",
    color: "hover:text-[#1DA1F2]",
    bgColor: "hover:bg-[#1DA1F2]/10",
  },
  {
    name: "GitHub",
    icon: Github,
    url: "https://github.com",
    color: "hover:text-foreground",
    bgColor: "hover:bg-foreground/10",
  },
];

export const SocialLinks = () => {
  return (
    <section className="py-24 px-4 relative border-t border-primary/10">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Присоединяйтесь к сообществу
          </h2>
          <p className="text-lg text-foreground/70">
            Следите за обновлениями и общайтесь с другими игроками
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className={`px-8 py-6 border-primary/30 bg-gradient-card ${social.bgColor} transition-all duration-300 hover:scale-110 hover:shadow-glow`}
                >
                  <Icon className={`w-6 h-6 mr-3 transition-colors ${social.color}`} />
                  <span className="text-lg font-semibold">{social.name}</span>
                </Button>
              </a>
            );
          })}
        </div>

        {/* Community stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">25K+</div>
            <div className="text-sm text-foreground/60">Discord участники</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20">
            <div className="text-2xl font-bold text-accent mb-1">100K+</div>
            <div className="text-sm text-foreground/60">YouTube подписчики</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20">
            <div className="text-2xl font-bold text-blue-neon mb-1">15K+</div>
            <div className="text-sm text-foreground/60">Twitter фолловеры</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">500+</div>
            <div className="text-sm text-foreground/60">GitHub звезды</div>
          </div>
        </div>
      </div>
    </section>
  );
};