import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FISH_COUNT = 26;
const MAX_SPEED = 2.8;
const BUBBLE_COUNT = 18;
const RIPPLE_GAP_MS = 95;

const createFish = (index, width, height) => {
  const angle = (index / FISH_COUNT) * Math.PI * 2;
  const radius = 70 + (index % 6) * 14;
  return {
    id: index,
    x: width * 0.5 + Math.cos(angle) * radius,
    y: height * 0.5 + Math.sin(angle) * radius,
    vx: Math.cos(angle + Math.PI / 2) * 1.2,
    vy: Math.sin(angle + Math.PI / 2) * 1.2,
    size: 12 + (index % 4) * 3,
    pulse: Math.random() * Math.PI * 2,
    scatter: 0,
    opacity: 0.95,
  };
};

const NeonFishSchool = () => {
  const layerRef = useRef(null);
  const fishNodesRef = useRef([]);
  const fishDataRef = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const viewportRef = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });
  const avoidRectsRef = useRef([]);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [ripples, setRipples] = useState([]);

  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }, (_, index) => ({
        id: index,
        x: `${((index * 17 + 13) % 100).toFixed(2)}%`,
        y: `${((index * 29 + 41) % 100).toFixed(2)}%`,
        size: 5 + (index % 5) * 3,
        delay: -(index % 9) * 1.1,
        duration: 14 + (index % 7) * 2.5,
        drift: (index % 2 ? 1 : -1) * (10 + (index % 4) * 9),
      })),
    [],
  );

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;

    const refreshAvoidRects = () => {
      const nodes = document.querySelectorAll(
        'a, button, input, textarea, select, [role="button"], .btn-primary, .btn-secondary, [data-fish-avoid]',
      );
      avoidRectsRef.current = Array.from(nodes)
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 6 && rect.height > 6);
    };

    const updateViewport = () => {
      viewportRef.current.width = window.innerWidth;
      viewportRef.current.height = window.innerHeight;
      refreshAvoidRects();
      if (!fishDataRef.current.length) {
        fishDataRef.current = Array.from({ length: FISH_COUNT }, (_, i) =>
          createFish(i, window.innerWidth, window.innerHeight),
        );
      }
    };

    updateViewport();
    refreshAvoidRects();

    let lastRippleAt = 0;
    const onPointerMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
      const now = performance.now();
      if (now - lastRippleAt > RIPPLE_GAP_MS) {
        lastRippleAt = now;
        setRipples((prev) => [...prev.slice(-5), { id: `${now}-${Math.random()}`, x: event.clientX, y: event.clientY }]);
      }
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    const mutationObs = new MutationObserver(() => refreshAvoidRects());
    mutationObs.observe(document.body, { childList: true, subtree: true, attributes: true });

    const animate = (timestamp) => {
      const dt = Math.min((timestamp - lastTimeRef.current || 16.7) / 16.7, 1.65);
      lastTimeRef.current = timestamp;
      const { width, height } = viewportRef.current;
      const pointer = pointerRef.current.active
        ? pointerRef.current
        : { x: width * 0.5, y: height * 0.56 };
      const fishData = fishDataRef.current;
      const avoidRects = avoidRectsRef.current;

      for (let i = 0; i < fishData.length; i += 1) {
        const fish = fishData[i];
        const toPointerX = pointer.x - fish.x;
        const toPointerY = pointer.y - fish.y;
        const pointerDist = Math.hypot(toPointerX, toPointerY) || 1;

        let ax = (toPointerX / pointerDist) * 0.05;
        let ay = (toPointerY / pointerDist) * 0.05;

        let nearestAvoidDist = Infinity;
        for (let j = 0; j < avoidRects.length; j += 1) {
          const rect = avoidRects[j];
          const cx = rect.left + rect.width * 0.5;
          const cy = rect.top + rect.height * 0.5;
          const radius = Math.max(rect.width, rect.height) * 0.68 + 36;
          const dx = fish.x - cx;
          const dy = fish.y - cy;
          const dist = Math.hypot(dx, dy) || 1;
          nearestAvoidDist = Math.min(nearestAvoidDist, dist - radius);
          if (dist < radius) {
            const repel = (radius - dist) / radius;
            ax += (dx / dist) * (0.3 + repel * 1.05);
            ay += (dy / dist) * (0.3 + repel * 1.05);
            fish.scatter = Math.min(1, fish.scatter + 0.09 * dt);
          }
        }

        if (nearestAvoidDist > 80) {
          fish.scatter = Math.max(0, fish.scatter - 0.03 * dt);
        }

        // light boid-style cohesion for underwater schooling behavior
        for (let k = 0; k < fishData.length; k += 1) {
          if (k === i) continue;
          const other = fishData[k];
          const dx = other.x - fish.x;
          const dy = other.y - fish.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 85) {
            const align = 0.002;
            ax += dx * align;
            ay += dy * align;
            if (dist < 22) {
              ax -= (dx / dist) * 0.035;
              ay -= (dy / dist) * 0.035;
            }
          }
        }

        fish.vx = (fish.vx + ax * dt) * 0.985;
        fish.vy = (fish.vy + ay * dt) * 0.985;

        const speed = Math.hypot(fish.vx, fish.vy) || 1;
        if (speed > MAX_SPEED) {
          fish.vx = (fish.vx / speed) * MAX_SPEED;
          fish.vy = (fish.vy / speed) * MAX_SPEED;
        }

        fish.x += fish.vx * dt;
        fish.y += fish.vy * dt;

        const bound = 36;
        if (fish.x < -bound) fish.x = width + bound;
        if (fish.x > width + bound) fish.x = -bound;
        if (fish.y < -bound) fish.y = height + bound;
        if (fish.y > height + bound) fish.y = -bound;

        fish.pulse += (0.04 + fish.size * 0.00032) * dt;
        fish.opacity = 0.24 + (1 - fish.scatter) * 0.76;

        const node = fishNodesRef.current[i];
        if (node) {
          const angle = Math.atan2(fish.vy, fish.vx);
          const sway = Math.sin(fish.pulse) * (6 + fish.scatter * 11);
          const scale = 0.86 + Math.cos(fish.pulse * 1.1) * 0.09;
          node.style.transform = `translate3d(${fish.x}px, ${fish.y}px, 0) rotate(${angle}rad) skewY(${sway}deg) scale(${scale})`;
          node.style.opacity = String(fish.opacity);
          node.style.filter = `drop-shadow(0 0 ${18 + fish.size * 0.55}px rgba(70, 232, 255, 0.46))`;
        }
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('scroll', refreshAvoidRects, { passive: true });

    rafRef.current = window.requestAnimationFrame(animate);
    const rectInterval = window.setInterval(refreshAvoidRects, 550);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('scroll', refreshAvoidRects);
      mutationObs.disconnect();
      window.clearInterval(rectInterval);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={layerRef} className="neon-fish-layer" aria-hidden="true">
      <div className="neon-ocean-light neon-ocean-light-a" />
      <div className="neon-ocean-light neon-ocean-light-b" />

      <div className="fish-school">
        {Array.from({ length: FISH_COUNT }, (_, index) => (
          <div
            key={index}
            className="neon-fish"
            ref={(node) => {
              fishNodesRef.current[index] = node;
            }}
          >
            <span className="fish-tail" />
            <span className="fish-body" />
            <span className="fish-eye" />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="fish-ripple"
            initial={{ scale: 0.14, opacity: 0.5 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: [0.16, 0.8, 0.2, 1] }}
            onAnimationComplete={() =>
              setRipples((prev) => prev.filter((entry) => entry.id !== ripple.id))
            }
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}
      </AnimatePresence>

      <div className="fish-bubbles">
        {bubbles.map((bubble) => (
          <motion.span
            key={bubble.id}
            className="fish-bubble"
            style={{
              left: bubble.x,
              top: bubble.y,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              '--bubble-drift': `${bubble.drift}px`,
            }}
            animate={{
              y: [0, -130, -220],
              x: [0, bubble.drift * 0.45, bubble.drift],
              opacity: [0, 0.34, 0],
              scale: [0.65, 1, 1.14],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: bubble.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NeonFishSchool;
