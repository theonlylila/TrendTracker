/**
 * A tiny confetti burst, rendered on a full-viewport canvas and torn down
 * after it finishes. No dependency — just particles + gravity.
 */
export function burstConfetti(originX: number, originY: number) {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  // Cutesy pastel confetti — pink, candy pink, lavender, baby blue, and
  // buttery yellow. This is where the "open to blues/purples/yellows" sprinkle
  // lives, since the celebration burst is a fun place for the extra colors.
  const colors = ["#f4a9cd", "#d24b91", "#b7a4e2", "#a7d8f0", "#f6e3a0"];
  const particles = Array.from({ length: 26 }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * -6 - 3,
    size: Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    life: 1,
  }));

  let frame: number;
  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      p.vy += 0.25; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= 0.018;

      if (p.life > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }

    if (alive) {
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      canvas.remove();
    }
  }

  frame = requestAnimationFrame(tick);
}
