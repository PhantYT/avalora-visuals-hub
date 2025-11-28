import { Eye, Zap, Shield, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Eye,
    title: "Продвинутые шейдеры",
    description: "Реалистичное освещение, тени и отражения для невероятной атмосферы",
  },
  {
    icon: Zap,
    title: "Оптимизация",
    description: "Максимальная производительность без потери качества визуала",
  },
  {
    icon: Palette,
    title: "Кастомизация",
    description: "Настройте каждый аспект визуала под свои предпочтения",
  },
  {
    icon: Shield,
    title: "Безопасность",
    description: "Защита от античитов и регулярные обновления",
  },
];

export const Features = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Возможности
          </h2>
          <p className="text-xl text-foreground/70">
            Всё что нужно для идеального визуального опыта
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glow group"
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-foreground/60">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
