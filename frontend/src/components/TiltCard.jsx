import { useRef } from 'react';

const TiltCard = ({
  children,
  className = '',
  maxTilt = 12,
  perspective = 1000,
  scale = 1.02,
}) => {
  const cardRef = useRef(null);

  const handlePointerMove = (event) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const percentX = (x / rect.width) * 2 - 1;
    const percentY = (y / rect.height) * 2 - 1;

    const rotateY = percentX * maxTilt;
    const rotateX = -percentY * maxTilt;

    card.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  };

  const resetTransform = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTransform}
      onPointerCancel={resetTransform}
    >
      {children}
    </div>
  );
};

export default TiltCard;
