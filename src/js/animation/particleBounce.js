/** Ballistic contact with the visible line, followed by one damped rebound. */
export function planParticleBounce(position, floor, radius, lift, drift, restitution = 0.48) {
  const gravity = 240;
  const y = Math.max(0, floor.y - radius - position.y);
  const duration = (lift + Math.sqrt(lift * lift + 2 * gravity * y)) / gravity;
  const x = Math.max(floor.left + radius, Math.min(floor.right - radius, position.x + drift)) - position.x;
  const vx = x / duration;
  const rebound = (gravity * duration - lift) * restitution;
  return { x, y, duration, gravity,
    velocity: Math.hypot(vx, lift), angle: Math.atan2(-lift, vx) * 180 / Math.PI,
    rebound, riseDuration: rebound / gravity };
}
