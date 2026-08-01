import { useEffect, useRef } from 'react';

export function AmbientMeshCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Glowing mesh color nodes
    const nodes = [
      { x: width * 0.2, y: height * 0.3, vx: 0.3, vy: 0.2, radius: 280, color: 'rgba(99, 102, 241, 0.07)' },
      { x: width * 0.7, y: height * 0.6, vx: -0.2, vy: 0.3, radius: 320, color: 'rgba(168, 85, 247, 0.06)' },
      { x: width * 0.5, y: height * 0.8, vx: 0.25, vy: -0.25, radius: 260, color: 'rgba(16, 185, 129, 0.05)' },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
        grad.addColorStop(0, node.color);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-80 mix-blend-screen transition-opacity duration-1000"
    />
  );
}
