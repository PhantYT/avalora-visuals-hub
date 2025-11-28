import { Play } from "lucide-react";

export const VideoShowcase = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Обзор визуалов
          </h2>
          <p className="text-xl text-foreground/70">
            Посмотрите как выглядит мод в действии
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.4)] group">
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-75 blur-xl group-hover:opacity-100 transition-opacity" />
            
            <div className="relative aspect-video bg-background/90 backdrop-blur-sm border-2 border-primary/30 rounded-2xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Avalora Visuals Showcase"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              {/* Decorative play button overlay (hidden when video loads) */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-hero/50 backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <Play className="w-10 h-10 text-primary fill-primary ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Video stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-sm text-foreground/60">Просмотров</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20">
              <div className="text-3xl font-bold text-accent mb-2">98%</div>
              <div className="text-sm text-foreground/60">Положительных отзывов</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20">
              <div className="text-3xl font-bold text-blue-neon mb-2">24/7</div>
              <div className="text-sm text-foreground/60">Поддержка</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};