import { motion } from "framer-motion";

export const VideoShowcase = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Обзор визуалов
          </h2>
          <p className="text-xl text-foreground/70">
            Посмотрите как выглядит мод в действии
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.4)]">
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-75 blur-xl" />
            
            <div className="relative aspect-video bg-background/90 backdrop-blur-sm border-2 border-primary/30 rounded-2xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Avalora Visuals Showcase"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Video stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-sm text-foreground/60">Просмотров</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20 hover:border-accent/40 transition-colors"
            >
              <div className="text-3xl font-bold text-accent mb-2">98%</div>
              <div className="text-sm text-foreground/60">Положительных отзывов</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 rounded-xl bg-gradient-card border border-primary/20 hover:border-blue-neon/40 transition-colors"
            >
              <div className="text-3xl font-bold text-blue-neon mb-2">24/7</div>
              <div className="text-sm text-foreground/60">Поддержка</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};