#!/usr/bin/env python3
"""合成宣傳短片配樂（純 numpy，無需網路）：輕快、明亮的 C 大調，112 BPM。
用法：python3 make_music.py out.wav [秒數]"""
import sys, numpy as np, wave
SR = 44100
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 62.0
out = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
bpm = 112; beat = 60 / bpm
N = int(SR * dur); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * (1 - max(0, pan)); R[i:i + len(s)] += s * (1 + min(0, pan))
def pluck(f, d=0.9):
    t = np.arange(int(SR * d)) / SR
    e = np.exp(-t * 5.5) * (1 - np.exp(-t * 400))
    return e * (np.sin(2*np.pi*f*t) + 0.35*np.sin(4*np.pi*f*t)*np.exp(-t*8) + 0.15*np.sin(6*np.pi*f*t)*np.exp(-t*12))
def bell(f, d=1.8):
    t = np.arange(int(SR * d)) / SR
    e = np.exp(-t * 2.6) * (1 - np.exp(-t * 300))
    return e * (np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*4) + 0.25*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*7))
def pad(f, d):
    t = np.arange(int(SR * d)) / SR
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8)
    s = sum(np.sin(2*np.pi*f*(1+dt)*t + ph) for dt, ph in [(0, 0), (0.003, 1.3), (-0.003, 2.1)])
    s += 0.4 * sum(np.sin(4*np.pi*f*(1+dt)*t) for dt in (0, 0.004))
    return a * s / 4
def kick(d=0.25):
    t = np.arange(int(SR * d)) / SR
    return np.sin(2*np.pi*(45 + 90*np.exp(-t*28))*t) * np.exp(-t*14)
def hat(d=0.06):
    n = rng.standard_normal(int(SR * d)); n = np.diff(n, prepend=0)
    return n * np.exp(-np.arange(len(n)) / SR * 70) * 0.5
chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]  # C Am F G
bars = int(dur / (beat * 4)) + 1
mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 83, 81, 79, 76, 74, 72]
for b in range(bars):
    t0 = b * beat * 4
    root, tri = chords[b % 4]
    add(None, t0, pad(midi(tri[0] - 12), beat * 4.1), 0.20, -0.2)
    add(None, t0, pad(midi(tri[2] - 12), beat * 4.1), 0.16, 0.2)
    add(None, t0, pluck(midi(root), 1.3), 0.55)
    add(None, t0 + beat * 2, pluck(midi(root), 1.0), 0.40)
    arp = [tri[0], tri[1], tri[2], tri[1] + 12, tri[2], tri[1], tri[0] + 12, tri[1]]
    for k in range(8):
        add(None, t0 + k * beat / 2, pluck(midi(arp[k] + 12 * (k % 2 == 0 and 0)), 0.7), 0.30, -0.3 if k % 2 else 0.3)
    if b >= 1:
        for k in range(4):
            add(None, t0 + k * beat, kick(), 0.5)
        for k in range(8):
            add(None, t0 + (k + 0.5) * beat / 2 * 1.0, hat(), 0.10, 0.4 if k % 2 else -0.4)
    if b >= 2:
        for k in range(4):
            add(None, t0 + k * beat, bell(midi(mel[(b * 4 + k) % 16]), 1.6), 0.22, 0.1)
x = np.stack([L, R], 1)
x /= np.max(np.abs(x)) * 1.05
fade = np.minimum(1, np.minimum(np.arange(N) / (SR * 0.5), (N - np.arange(N)) / (SR * 3.0)))
x *= fade[:, None] * 0.9
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype('<i2').tobytes())
print('ok', out, dur)
