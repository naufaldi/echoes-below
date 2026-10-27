(() => {
  if (window.__ebSample) return 'ready';
  const proto = WebGL2RenderingContext.prototype;
  const stats = { draws: 0, tris: 0 };
  for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
    const original = proto[name];
    proto[name] = function (mode, a, b, c, d) {
      stats.draws++;
      const count = name.startsWith('drawElements') ? a : b;
      const inst = name.endsWith('Instanced') ? (name === 'drawElementsInstanced' ? d : c) : 1;
      if (mode === this.TRIANGLES) stats.tris += (count / 3) * inst;
      return original.apply(this, arguments);
    };
  }
  window.__ebSample = (ms) => new Promise(resolve => {
    const deltas = [], draws = [], tris = [];
    let last = performance.now(); const end = last + ms;
    stats.draws = 0; stats.tris = 0;
    const step = (now) => {
      deltas.push(now - last); draws.push(stats.draws); tris.push(stats.tris);
      stats.draws = 0; stats.tris = 0; last = now;
      if (now < end) requestAnimationFrame(step); else {
        const s = [...deltas.slice(1)].sort((x, y) => x - y);
        const q = p => s[Math.min(s.length - 1, Math.floor(s.length * p))];
        const avg = a => a.slice(1).reduce((x, y) => x + y, 0) / Math.max(1, a.length - 1);
        resolve({ frames: s.length, medianMs: +q(.5).toFixed(2), p95Ms: +q(.95).toFixed(2), maxMs: +s[s.length - 1].toFixed(2), fps: +(1000 / avg(deltas)).toFixed(1), drawCallsPerFrame: Math.round(avg(draws)), trianglesPerFrame: Math.round(avg(tris)) });
      }
    };
    requestAnimationFrame(step);
  });
  return 'installed';
})()
