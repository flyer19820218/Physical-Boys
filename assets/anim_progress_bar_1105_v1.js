/* assets/anim_progress_bar_1105_v1.js — 教學動畫「畫布內」的進度條（全站共用；老師 2026-11-05 指示）
 *
 * 為什麼：原本只有畫布最上緣一條 6px 的細線，老師與學生看不出「現在播到哪一步、這一步播了多少」，
 * 全螢幕投影時畫布外的控制列又看不到。所以進度條畫在畫布裡，而且要一眼看得出位置。
 *
 * 長相（無文字）：畫布頂端 y=8～24 一條粗進度條，依步驟切成 N 段（段長與步驟秒數成比例、段與段之間留縫）：
 *   已播完的步驟＝半亮黃整段填滿；正在播的步驟＝亮黃填到目前時間，外框亮黃，終點一顆白色圓點（播放頭，帶光暈）；
 *   還沒播到的步驟＝只有暗底。步驟播完停住時，播放頭停在該段終點。
 *
 * 用法（在各動畫的 render() 裡、畫完場景之後呼叫；座標系是 1000×600 的邏輯座標）：
 *   AnimBar.draw(ctx, W, STARTS, TOTAL, t);
 *     W      畫布邏輯寬度（1000）
 *     STARTS 每個步驟的開始秒數陣列（第一個是 0）
 *     TOTAL  整段動畫總秒數
 *     t      目前時間（秒）
 *   動畫內容請避開畫布最上方 0～30px。
 */
(function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const YEL = '#fde047';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      r = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
  }

  function draw(ctx, W, starts, total, t) {
    const n = starts.length; if (!n || !(total > 0)) return;
    const mx = 20, y = 8, h = 16, gap = 6;
    const usable = W - 2 * mx - gap * (n - 1);
    let cur = 0; while (cur + 1 < n && t >= starts[cur + 1]) cur++;
    ctx.save();
    let x = mx, head = null;
    for (let i = 0; i < n; i++) {
      const end = i + 1 < n ? starts[i + 1] : total, dur = end - starts[i];
      const w = usable * dur / total;
      const f = clamp((t - starts[i]) / dur, 0, 1);
      // 暗底
      rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(242,236,217,0.16)'; ctx.fill();
      // 填滿（已播完＝半亮，目前＝亮黃到目前時間）
      if (i < cur || (i === cur && f > 0)) {
        const fw = i < cur ? w : Math.max(h, w * f);
        ctx.save(); rr(ctx, x, y, w, h, h / 2); ctx.clip();
        ctx.fillStyle = i < cur ? 'rgba(253,224,71,0.55)' : YEL; ctx.fillRect(x, y, fw, h);
        ctx.restore();
      }
      if (i === cur) {
        rr(ctx, x, y, w, h, h / 2); ctx.lineWidth = 2.5; ctx.strokeStyle = YEL; ctx.stroke();
        head = { x: x + Math.max(h / 2, w * f), y: y + h / 2 };
      }
      x += w + gap;
    }
    if (head) {                       // 播放頭
      ctx.shadowColor = YEL; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(head.x, head.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbe6'; ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = YEL; ctx.stroke();
    }
    ctx.restore();
  }

  window.AnimBar = { draw };
})();
