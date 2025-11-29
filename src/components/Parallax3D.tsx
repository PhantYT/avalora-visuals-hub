import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import bg3dShapes from "@/assets/bg-3d-shapes.jpg";

export const Parallax3D = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden bg-gradient-hero">
      {/* Background image with parallax */}
      <motion.div 
        style={{ y: y1, opacity }}
        className="absolute inset-0"
      >
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${bg3dShapes})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </motion.div>

      {/* Floating 3D elements */}
      <div className="absolute inset-0">
        <motion.div
          style={{ y: y2 }}
          className="absolute top-1/4 left-1/4 w-64 h-64"
        >
          <div className="relative w-full h-full">
            <motion.div
              animate={{
                rotateY: [0, 360],
                rotateX: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl backdrop-blur-sm border border-primary/30 shadow-glow"
              style={{ transformStyle: "preserve-3d" }}
            />
          </div>
        </motion.div>

        <motion.div
          style={{ y: y3 }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48"
        >
          <div className="relative w-full h-full">
            <motion.div
              animate={{
                rotateZ: [0, 360],
                rotateY: [0, 360],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-br from-accent/20 to-blue-neon/20 rounded-full backdrop-blur-sm border border-accent/30 shadow-neon"
              style={{ transformStyle: "preserve-3d" }}
            />
          </div>
        </motion.div>

        <motion.div
          style={{ y: y2 }}
          className="absolute top-1/2 right-1/3 w-56 h-56"
        >
          <div className="relative w-full h-full">
            <motion.div
              animate={{
                rotateX: [0, 360],
                rotateZ: [0, 360],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-br from-blue-neon/20 to-primary/20 rounded-2xl backdrop-blur-sm border border-blue-neon/30"
              style={{ transformStyle: "preserve-3d", transform: "rotateX(45deg) rotateZ(45deg)" }}
            />
          </div>
        </motion.div>
      </div>

      {/* Center content */}
      <motion.div 
        style={{ scale }}
        className="relative z-10 h-full flex items-center justify-center"
      >
        <div className="text-center px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-blue-neon bg-clip-text text-transparent"
          >
            Погрузитесь в мир визуалов
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl text-foreground/70 max-w-3xl mx-auto"
          >
            Современные 3D эффекты и parallax анимации для незабываемого опыта
          </motion.p>
        </div>
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />
    </section>
  );
};