# Biosphere cinema progress — 2026-10-11

Implemented independent JS/CSS (no host HTML, shared engines, index or Git touched).

Chosen and downloaded assets:
- Microscopic: **Paramecium caudatum**, MTadey, CC BY 4.0. Reuses and re-verifies existing original. https://commons.wikimedia.org/wiki/File:Param%C3%A9cium_caud%C3%A1tum.jpg
- Actual organism/habitat: **female mallard on Cedar Mill Wetlands pond**, CEKeech, CC0 1.0. https://commons.wikimedia.org/wiki/File:On_a_Golden_Pond,_230821_DSCN1974.jpg
- Earth: **Blue Marble Next Generation, July 2004**, NASA Earth Observatory / Reto Stöckli. Downloaded 5400×2700 original, resized proportionally to4096×2048. https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/ ; media policy https://www.nasa.gov/nasa-brand-center/images-and-media/

The initial 48-second camera path was reviewed by the teacher and shortened, at their request, to **20 seconds**. Geometry uses the original normalized camera path; elapsed real time drives playback so slow rendering cannot stretch the film indefinitely. The final hold adds an original cut-apple illustration and bilingual scale explanation: a 10 cm model Earth has a roughly 0.16 mm living layer. The enlarged drawn peel is explicitly an analogy, not measured fruit skin.

Runtime assets and fallback sphere are present. Native Canvas QA passed: 20s timing, eight pixel-motion comparisons, monotonic retreat, exact final relative shell, and apple conversion. Source protection passed: seven protected files and original host HTML/SVG/inline JS identical after removing the additive imports. Simulated DOM tests cover runtime controls and original yeast/tab behavior; a stale fullscreen Promise that could close a newer session was found and repaired. Detailed sources/conditions/modifications are in `sources.md` and on the page.

Integrated `BiosphereCinema.mount()` after ALL three chapter1 adapters in the formal `biology_intro.html`. It hides the old board, retaining its original nodes and IDs for paintBio and translations. API returns ready Promise, seek/play/pause/fullscreen/state/destroy. No auto-mount. All unrelated dirty work remains untouched. Teacher explicitly authorized publishing this revision to main; deployment must be verified separately from the local tests.

Actual WebGL/browser/iPad verification remains unavailable; no browser safety bypass was attempted. Native rendering and simulated events are not physical-device validation.
