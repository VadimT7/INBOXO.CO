import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Inbox } from 'lucide-react';

const GlowingBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      targetPosition.current = mousePosition.current;
      currentPosition.current.x = lerp(currentPosition.current.x, targetPosition.current.x, 0.1);
      currentPosition.current.y = lerp(currentPosition.current.y, targetPosition.current.y, 0.1);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mainGlow = ctx.createRadialGradient(
        currentPosition.current.x,
        currentPosition.current.y,
        0,
        currentPosition.current.x,
        currentPosition.current.y,
        Math.max(canvas.width, canvas.height) * 0.8
      );

      const time = Date.now() * 0.001;
      const hue1 = Math.sin(time * 0.1) * 60 + 200;
      const hue2 = Math.cos(time * 0.1) * 60 + 300;

      mainGlow.addColorStop(0, `hsla(${hue1}, 100%, 70%, 0.7)`);
      mainGlow.addColorStop(0.2, `hsla(${hue2}, 100%, 70%, 0.5)`);
      mainGlow.addColorStop(0.4, `hsla(${hue1}, 100%, 70%, 0.3)`);
      mainGlow.addColorStop(1, 'hsla(240, 60%, 10%, 0.9)');

      ctx.fillStyle = mainGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouseGlow = ctx.createRadialGradient(
        currentPosition.current.x,
        currentPosition.current.y,
        0,
        currentPosition.current.x,
        currentPosition.current.y,
        400
      );

      mouseGlow.addColorStop(0, 'hsla(210, 100%, 80%, 0.8)');
      mouseGlow.addColorStop(0.3, 'hsla(210, 100%, 70%, 0.5)');
      mouseGlow.addColorStop(0.6, 'hsla(210, 100%, 60%, 0.3)');
      mouseGlow.addColorStop(1, 'hsla(210, 100%, 50%, 0)');

      ctx.fillStyle = mouseGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      frame = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      mousePosition.current = {
        x: canvas.width / 2,
        y: canvas.height / 2
      };
      currentPosition.current = { ...mousePosition.current };
      targetPosition.current = { ...mousePosition.current };
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full -z-10"
      style={{ mixBlendMode: 'soft-light' }}
    />
  );
};

const AnimatedText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      className="relative cursor-default"
      style={{
        perspective: 1000,
      }}
    >
      <motion.div
        className={className}
        style={{
          transformStyle: "preserve-3d",
        }}
        initial={{
          scale: 1,
          z: 20,
        }}
        whileHover={{
          scale: 1.07,
          z: 60,
        }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 150,
        }}
      >
        {children}
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(-40px)",
            opacity: 0.6,
            filter: "blur(10px)",
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const AnimatedGradientText = ({ children }: { children: string }) => {
  const [gradientPosition, setGradientPosition] = useState({ x: 0, y: 0 });
  
  useAnimationFrame((time) => {
    const x = Math.sin(time * 0.001) * 100 + 100;
    const y = Math.cos(time * 0.001) * 100 + 100;
    setGradientPosition({ x, y });
  });

  return (
    <span
      className="bg-clip-text text-transparent relative"
      style={{
        backgroundImage: `radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%, #60A5FA 0%, #2DD4BF 30%, #4ADE80 70%)`,
        backgroundSize: "200% 200%",
      }}
    >
      {children}
    </span>
  );
};

const AnimatedHero = () => {
  const { session } = useAuthSession();

  return (
    <div className="relative w-full h-full">
      <GlowingBackground />
    </div>
  );
};

export default AnimatedHero; 