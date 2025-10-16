export async function fireConfettiBurst() {
  const confetti = (await import('canvas-confetti')).default;
  const defaults = { spread: 60, startVelocity: 45, ticks: 180, scalar: 1 };
  confetti({ particleCount: 120, angle: 60, origin: { x: 0 }, ...defaults });
  confetti({ particleCount: 120, angle: 120, origin: { x: 1 }, ...defaults });
}

