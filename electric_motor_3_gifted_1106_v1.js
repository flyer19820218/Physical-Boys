/* electric_motor_3_gifted_1106_v1.js — 「資優補充」分頁（#tab-gifted）的轉交模組（外層加法）
 *
 * 老師 2026-11-06 指示：把三個「補充」從「電線會互相吸？（開掌定則實例）」拉出來，另開第 6 個主分頁「資優補充」。
 * 這個分頁的畫布是 #giftedCanvas、步驟列 #steps-gifted、說明框 #giftedResult；三個場景各由一支獨立動畫模組播放：
 *   'example-aurora'   → electric_motor_3_aurora_1105_v1.js   （MotorAnim.aurora）   美麗的極光
 *   'example-daynight' → electric_motor_3_daynight_1106_v1.js （MotorAnim.daynight） 白天的極光去哪了？
 *   'example-energy'   → electric_motor_3_energy_1106_v1.js   （MotorAnim.energy）   粒子的能量從哪來？
 * 契約：window.MotorAnim.gifted = { activate(sceneId), deactivate(), relang(), _info(), _state(), _frameAt(sceneId, t) }
 * 老師講解模式的接力、進度條、暫停都走頁面共用的 electric_motor_3_teach_1104_v1.js（MOD 表有 'tab-gifted': 'gifted'）。
 * 本檔不畫任何東西，只轉交。
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;
  const MAP = { 'example-aurora': 'aurora', 'example-daynight': 'daynight', 'example-energy': 'energy' };
  let cur = null;                                   // 目前接手的模組鍵
  MA.gifted = {
    activate(sceneId) {
      if (cur && MA[cur]) { MA[cur].deactivate(); cur = null; }
      const k = MAP[sceneId] || 'aurora';
      if (MA[k]) { cur = k; MA[k].activate(MAP[sceneId] ? sceneId : 'example-aurora'); }
    },
    deactivate() { if (cur && MA[cur]) MA[cur].deactivate(); cur = null; },
    relang() { if (cur && MA[cur]) MA[cur].relang(); },
    _frameAt(sceneId, t) { const k = MAP[sceneId]; return k && MA[k] && MA[k]._frameAt ? MA[k]._frameAt(sceneId, t) : null; },
    _info() { const o = {}; for (const k of Object.values(MAP)) if (MA[k]) Object.assign(o, MA[k]._info()); return o; },
    _state() { return cur && MA[cur] ? MA[cur]._state() : { scene: null, t: 0, step: -1, running: false }; }
  };
})();
