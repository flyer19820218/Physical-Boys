/* Human transport: bilingual teaching copy, 2026-10-12.
 * Main's registration interceptor calls HumanTransportTeaching.apply(spec).
 * No DOM, registration, drawing, timing, audio, controls or state writes here.
 * Evidence and media licences: human_transport_research_1012_v1.md.
 */
(function (root) {
  'use strict';

  const P = (zh, en) => [zh, en];
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }

  const header = freeze({
    title: P('人體的運輸', 'Transport in humans'),
    subtitle: P('跟著血液，認識心臟、血管與淋巴的合作。', 'Follow blood and see how the heart, vessels and lymph work together.')
  });

  // Arrays follow LivingBook's existing [Traditional Chinese, English] contract.
  // caption/modelNote are available to main; apply only writes supported fields.
  const copy = freeze({
    heart: {
      title: P('咚咚，算幾次？', 'Two sounds, one beat?'),
      sub: P('心臟與瓣膜', 'Heart and valves'),
      heading: P('瓣膜怎麼守住流向？', 'How do valves keep blood moving forward?'),
      hook: P('聽到「咚咚」，是心跳兩次嗎？看瓣膜關閉的時刻，找出兩個心音的來源。', 'Does “lub-dub” mean two heartbeats? Watch the valves close and find where each sound comes from.'),
      body: P('心房收血，心室送血；四個瓣膜隨壓力差開閉，讓血液向前流。', 'Atria receive blood and ventricles pump it out. Pressure differences open and close four valves to keep blood moving forward.'),
      closure: P('S1：房室瓣關閉；S2：半月瓣關閉。一組「咚咚」是一次心搏。', 'S1: AV valves close. S2: semilunar valves close. One “lub-dub” pair is one heartbeat.'),
      caption: P('第一心音 S1 與房室瓣關閉有關；第二心音 S2 與半月瓣關閉有關。兩個心音屬於同一次心搏。', 'The first sound, S1, is linked to AV valve closure. The second, S2, is linked to semilunar valve closure. Both belong to one heartbeat.'),
      modelNote: P('瓣膜與心音為教學示意；合成聲音不是人體錄音。', 'Valves and sounds are a teaching model. Synthesized sounds are not a human recording.'),
      readingExtra: P('心音補充：心室開始收縮時，房室瓣關閉，出現第一心音 S1；射血結束、心室開始舒張時，半月瓣關閉，出現第二心音 S2。瓣膜開啟不等於產生正常的 S1 或 S2。', 'Heart sounds: AV valves close as ventricular contraction starts, producing S1. Semilunar valves close as ejection ends and relaxation starts, producing S2. Valve opening does not produce the normal S1 or S2.')
    },
    vessels: {
      title: P('動脈一定富氧？', 'Are arteries always oxygen-rich?'),
      sub: P('三種血管', 'Three vessel types'),
      heading: P('流向決定血管名稱', 'Flow direction names the vessel'),
      hook: P('肺動脈帶著少氧血，為什麼還叫動脈？先找心臟，再沿著血流判斷方向。', 'Why is the pulmonary artery an artery if its blood has less oxygen? Find the heart and follow the flow.'),
      body: P('動脈把血帶離心臟，靜脈把血帶回心臟，微血管讓血液與組織交換物質。', 'Arteries carry blood away from the heart, veins bring it back, and capillaries allow exchange with tissues.'),
      closure: P('動靜脈看流向；微血管看交換。肺動脈少氧，肺靜脈富氧。', 'Name arteries and veins by flow direction. Capillaries allow exchange. Pulmonary arteries carry less oxygen; pulmonary veins carry more.'),
      caption: P('比較管壁與管腔，再看血液離心或回心。鮮紅、暗紅表示相對含氧量，不能單靠顏色命名血管。', 'Compare walls and lumens, then check flow away from or toward the heart. Bright and dark red show relative oxygen levels; colour alone does not name a vessel.'),
      modelNote: P('血管剖面為教學示意；血球大小與數量未按實際比例。', 'The vessel cutaway is a teaching model. Cell sizes and counts are not to scale.')
    },
    blood: {
      title: P('誰送氧？誰止血？', 'Who carries oxygen? Who stops bleeding?'),
      sub: P('血液成分', 'Blood components'),
      heading: P('一管血，各有分工', 'One sample, different jobs'),
      hook: P('一管血裡，送氧、抵抗病原與止血的都是同一種成分嗎？比較血漿、血球與血小板。', 'Does one component carry oxygen, fight germs and stop bleeding? Compare plasma, blood cells and platelets.'),
      body: P('血漿運送溶解物質；紅血球、白血球與血小板各有不同任務。', 'Plasma carries dissolved substances. Red cells, white cells and platelets each have different jobs.'),
      closure: P('血漿運輸，紅血球攜氧，白血球防禦，血小板協助止血。', 'Plasma transports, red cells carry oxygen, white cells defend, and platelets help stop bleeding.'),
      caption: P('成熟人類紅血球沒有細胞核，血紅素攜帶氧氣。富氧血較鮮紅；少氧血仍是暗紅。', 'Mature human red cells have no nucleus. Hemoglobin carries oxygen. Oxygen-rich blood is brighter red; oxygen-poor blood is still dark red.'),
      modelNote: P('染色與電子影像著色用來辨認構造；模型顆粒數不是血球檢驗值。', 'Stains and added image colours help identify structures. Model particle counts are not blood-test results.')
    },
    circulation: {
      title: P('全身怎麼送到？', 'How does blood reach the body?'),
      sub: P('體循環與肺循環', 'Body and lung circuits'),
      heading: P('分送各處，再回心臟', 'Branch out, then return'),
      hook: P('一顆紅血球要先逛完每個器官，才能回心臟嗎？看看主動脈怎麼分支，再追蹤一條完整路線。', 'Must one red cell visit every organ before returning? See how the aorta branches, then follow one complete route.'),
      body: P('左心室把血經主動脈分送各器官，回右心後送往肺補氧，再回左心。', 'The left ventricle sends blood through the aorta to different organs. Blood returns to the right heart, gains oxygen in the lungs, then returns to the left heart.'),
      closure: P('體循環：左心室到右心房；肺循環：右心室到左心房。各器官有支路。', 'Body circuit: left ventricle to right atrium. Lung circuit: right ventricle to left atrium. Organs have separate branches.'),
      caption: P('主動脈分支供應各器官，多數器官的血流走不同支路；一顆紅血球一次走其中一條。肺動脈少氧，肺靜脈富氧。', 'Aortic branches supply different organs. Most organs lie on separate routes; one red cell follows one route at a time. Pulmonary arteries carry less oxygen, pulmonary veins more.'),
      modelNote: P('路線為教學示意；器官位置、管徑與旅行時間未按實際比例。', 'Routes are a teaching model. Organ positions, vessel widths and travel times are not to scale.'),
      readingExtra: P('器官支路補充：多數器官由不同動脈支路供血，不是全部先通過同一個器官。小腸微血管的血經肝門靜脈到肝臟，再由肝靜脈流入下大靜脈；肝門靜脈不是主動脈分支。肝臟另有肝動脈供血。心肌由主動脈分出的冠狀動脈供血，經心肌微血管、冠狀靜脈回流，多數經冠狀竇進入右心房。', 'Organ branches: most organs receive blood through separate arterial branches. Blood from small-intestine capillaries goes through the hepatic portal vein to the liver, then through hepatic veins to the inferior vena cava. The portal vein is not an aortic branch. The liver also receives blood from the hepatic artery. Coronary arteries branch from the aorta to supply heart muscle. Blood returns through cardiac capillaries and coronary veins, mostly through the coronary sinus to the right atrium.')
    },
    lymph: {
      title: P('組織液怎麼回來？', 'How does tissue fluid return?'),
      sub: P('組織液與淋巴', 'Tissue fluid and lymph'),
      heading: P('從細胞間，回到靜脈', 'From between cells back to veins'),
      hook: P('血液把物質送到細胞旁，組織液又怎麼回到循環？沿著淋巴管找回程。', 'Blood brings substances close to cells. How does tissue fluid return? Follow the lymphatic route.'),
      body: P('血漿的部分水與小分子進入細胞間，形成組織液；進入淋巴管後稱為淋巴，最後回到靜脈。', 'Some water and small molecules from plasma enter spaces between cells as tissue fluid. In lymphatic vessels this fluid is called lymph. It returns to veins.'),
      closure: P('血漿 → 組織液 → 淋巴管內的淋巴 → 靜脈。', 'Plasma → tissue fluid → lymph in lymphatic vessels → veins.'),
      caption: P('血漿的部分水與小分子進入細胞間，形成組織液；組織液進入淋巴管後稱為淋巴，最後注入靜脈，回到血液循環。', 'Some water and small molecules from plasma enter spaces between cells as tissue fluid. After entering lymphatic vessels, the fluid is called lymph. It enters veins and rejoins blood circulation.'),
      modelNote: P('綠色用來區分淋巴路徑，不是淋巴的原色。', 'Green marks the lymphatic route; it is not the natural colour of lymph.')
      // Teacher approved the textbook main route on 2026-10-12.
      // Only the exact disputed paragraph/caption is replaced below.
    },
    experiment: {
      title: P('摸到的是什麼？', 'What do you feel?'),
      sub: P('心音、脈搏與血流', 'Heart sounds, pulse and flow'),
      heading: P('聽心音，摸脈搏', 'Listen to the heart, feel the pulse'),
      hook: P('手腕上的一下，是一顆血球撞過來嗎？觀察動脈壁的擴張，再比較摸到與聽到的次數。', 'Is a pulse a red cell hitting your wrist? Watch the artery wall expand, then compare the beats you feel and hear.'),
      body: P('心室射血引起動脈壁擴張與回復。量一分鐘的心搏與脈搏，再觀察魚尾血流的分支與匯流。', 'Ventricular ejection makes artery walls expand and recoil. Count heartbeats and pulse for one minute, then observe branching and merging in fish-tail blood flow.'),
      closure: P('一組心音算一次心搏；脈搏是動脈壁的脈動；血流分支送出、匯流回程。', 'One sound pair counts as one heartbeat. A pulse is arterial wall movement. Blood branches outward and merges on return.'),
      caption: P('脈搏是壓力波傳來時，動脈壁的擴張與回復；不是同一顆血球從心臟一路撞到手腕。', 'A pulse is artery wall expansion and recoil as a pressure wave arrives. It is not one red cell travelling from the heart and hitting the wrist.'),
      soundCaption: P('S1 對應房室瓣關閉，S2 對應半月瓣關閉；把一組「咚咚」記成一次心搏。', 'S1 goes with AV valve closure and S2 with semilunar valve closure. Count one “lub-dub” pair as one heartbeat.'),
      modelNote: P('壁脈波是教學示意；點按或輸入的紀錄才是你的量測。', 'The wall wave is a teaching model. Your taps or entered records are your measurements.'),
      readingExtra: P('脈波補充：心室射血造成壓力變化，沿動脈傳播，讓各處管壁依序擴張與回復。壓力波傳播與血液流動是不同的現象；示意動畫不能替你計算實際脈搏。', 'Pulse waves: ventricular ejection changes pressure. The pressure wave travels along arteries, whose walls expand and recoil in sequence. Wave travel and blood flow are different. A model animation cannot count your actual pulse.')
    }
  });

  const sources = freeze([
    { topic: 'heart-sounds', title: 'NHLBI: How the heart beats', url: 'https://www.nhlbi.nih.gov/health/heart/heart-beats' },
    { topic: 'circulation', title: 'NHLBI: How blood flows through the heart', url: 'https://www.nhlbi.nih.gov/health/heart/blood-flow' },
    { topic: 'coronary-return', title: 'NCI SEER: Structure of the heart', url: 'https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html' },
    { topic: 'portal-circulation', title: 'NCI SEER: Accessory organs', url: 'https://training.seer.cancer.gov/anatomy/digestive/regions/accessory.html' },
    { topic: 'pulse-wave', title: 'Negoita et al. (2018): Ultrasound diameter and velocity', url: 'https://doi.org/10.1088/1361-6579/aae8a0' },
    { topic: 'lymph-evidence-only', title: 'Michel & Phillips (1987): Steady-state filtration', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1192556/' },
    { topic: 'lymph-evidence-only', title: 'Adamson et al. (2004): Oncotic pressures', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1665140/' }
  ]);

  const applied = new WeakMap();
  const outputs = new WeakSet();
  const fields = ['title', 'sub', 'hook', 'body', 'closure'];
  const isPair = value => Array.isArray(value) && value.length === 2 && value.every(x => typeof x === 'string');
  function appendPair(original, extra) {
    if (!isPair(original) || !isPair(extra)) return original;
    return original.map((text, i) => text ? text + '\n\n' + extra[i] : extra[i]);
  }
  const oldLymphParagraph = P(
    '依課本的簡化模型，部分組織液回到血管，部分進入鄰近淋巴管。實際淨流量依組織、壓力與狀態而異；本圖不固定分配比例，也不表示每一條微血管都同樣回收。',
    'In the textbook\'s simplified model, some tissue fluid returns directly to blood and some enters nearby lymphatics. Net flow depends on tissue, pressure and state; the model assigns no fixed fractions or identical behaviour to every capillary.'
  );
  function approvedLymphText(original) {
    if (!isPair(original)) return original;
    return original.map((text, i) => text.split(oldLymphParagraph[i]).join(copy.lymph.caption[i]));
  }
  function captionFor(id, state) {
    if (id === 'heart') return copy.heart.caption;
    if (id === 'circulation' && (!state || state.view === 'loop')) return copy.circulation.caption;
    if (id === 'experiment' && state && state.view !== 'fish') {
      return state.photo === 'sound' ? copy.experiment.soundCaption : copy.experiment.caption;
    }
    return null;
  }
  function apply(spec) {
    if (!spec || spec.id !== 'human' || !Array.isArray(spec.tabs)) return spec;
    if (outputs.has(spec)) return spec;
    if (applied.has(spec)) return applied.get(spec);

    const result = { ...spec, title: [...header.title], subtitle: [...header.subtitle] };
    result.tabs = spec.tabs.map(tab => {
      if (!tab || !Object.prototype.hasOwnProperty.call(copy, tab.id)) return tab;
      const words = copy[tab.id];
      const next = { ...tab };
      fields.forEach(key => { next[key] = [...words[key]]; });
      if (words.readingExtra && isPair(tab.reading)) next.reading = appendPair(tab.reading, words.readingExtra);
      if (tab.id === 'lymph' && isPair(tab.reading)) next.reading = approvedLymphText(tab.reading);
      // Call the original explanation once, keep its selection/phase/data and
      // all extra result fields; only append relevant bilingual teaching text.
      if (['heart', 'circulation', 'lymph', 'experiment'].includes(tab.id) && typeof tab.explain === 'function') {
        next.explain = wrapExplanation(tab.id, tab.explain);
      }
      return next;
    });
    applied.set(spec, result);
    outputs.add(result);
    return result;
  }
  function wrapExplanation(id, original) {
    return function () {
      const result = original.apply(this, arguments);
      if (id === 'lymph' && result && isPair(result.text)) {
        return { ...result, text: approvedLymphText(result.text) };
      }
      const extra = captionFor(id, arguments[0]);
      if (!result || !extra || !isPair(result.text)) return result;
      return { ...result, text: appendPair(result.text, extra) };
    };
  }

  root.HumanTransportTeaching = Object.freeze({ version: '1012_v1', apply, header, copy, sources });
})(typeof window === 'undefined' ? globalThis : window);
