/* Unit 11 "Humans and the environment" shared kit, 2026-10-24. Wraps window.EcologyKit (ecology_kit_1023_v1.js, must load first).
 * Adds: picture sizes of the new Gemini pictures (folder environment_ai_1024/) and of the textbook originals used here (environment_originals_1010_v1/),
 * the unit colour meanings (plan 1.4), and shared labels. Pictures from other folders are addressed 'folder/file.png' (relative to assets/biology/);
 * pictures of ecology_ai_1023/ keep their plain file name. Draw modules register window.EnvironmentDraw[name]=(c,s,t)=>{} (canvas 960x600).
 */
(()=>{'use strict';
const K=window.EcologyKit,P=K.P;
Object.assign(K.SIZE,{"environment_ai_1024/BD1_ladybird_black2red.png":[416,524],"environment_ai_1024/BD1_ladybird_black4red.png":[413,488],"environment_ai_1024/BD1_ladybird_orange0.png":[418,525],"environment_ai_1024/BD1_ladybird_orange19.png":[417,525],"environment_ai_1024/BD1_ladybird_pale.png":[415,488],"environment_ai_1024/BD1_ladybird_patch.png":[413,488],"environment_ai_1024/BD2_rice_black.png":[304,301],"environment_ai_1024/BD2_rice_brown.png":[304,301],"environment_ai_1024/BD2_rice_red.png":[303,301],"environment_ai_1024/BD2_rice_white.png":[303,301],"environment_ai_1024/BD3_cricket.png":[306,212],"environment_ai_1024/BD3_dragonfly.png":[330,241],"environment_ai_1024/BD3_honeybee.png":[279,207],"environment_ai_1024/BD3_swallowtail.png":[337,249],"environment_ai_1024/BD4_reef.jpg":[1672,933],"environment_ai_1024/BD5_mosaic.jpg":[1672,933],"environment_ai_1024/BD6_blue_magpie.png":[274,418],"environment_ai_1024/BD6_macaque.png":[260,375],"environment_ai_1024/BD6_muntjac.png":[348,363],"environment_ai_1024/BD6_swinhoes_pheasant.png":[364,385],"environment_ai_1024/BD8_cotton.png":[366,490],"environment_ai_1024/BD8_silk_cocoons.png":[317,291],"environment_ai_1024/BD8_timber.png":[397,300],"environment_originals_1010_v1/Im8_80.png":[356,249],"environment_originals_1010_v1/Im10_82.png":[356,249],"environment_originals_1010_v1/Im12_84.png":[378,279],"environment_originals_1010_v1/Im15_96.png":[546,371],"environment_originals_1010_v1/Im16_97.png":[546,371],"environment_originals_1010_v1/Im17_98.png":[546,371],"environment_originals_1010_v1/Im18_99.png":[546,371],"environment_originals_1010_v1/Im19_100.png":[546,371],"environment_originals_1010_v1/Im25_226.png":[527,357],"environment_originals_1010_v1/Im26_229.png":[527,357],"environment_originals_1010_v1/Im35_344.png":[468,443]});
const ENV='environment_ai_1024/',ORIG='environment_originals_1010_v1/';
// colour meanings, fixed for the whole unit; always written together with the name
const COL={genetic:'#f472b6',species:'#55e9ff',ecosystem:'#4ade80',pressure:'#fb923c',nutrient:'#f472b6',conc:'#fde047',count:'#4ade80',protect:'#4ade80',evidence:'#55e9ff',unknown:'#f2ecd9'};
const LAB={
 aiNote:P(`AI 插圖，非實拍`,`AI illustration, not a photo`),schematic:P(`示意`,`Schematic`),sizeNoReal:P(`大小不代表真實大小`,`Sizes are not real sizes`),
 toCheck:P(`待查`,`To check`),notProved:P(`還沒證明`,`Not shown yet`),
 genetic:P(`遺傳多樣性`,`Genetic diversity`),species:P(`物種多樣性`,`Species diversity`),ecosystem:P(`生態系多樣性`,`Ecosystem diversity`),
 place:P(`地點`,`Place`),area:P(`面積`,`Area`),time:P(`時間`,`Time`),method:P(`方法`,`Method`)
};
K.LAB=Object.assign(K.LAB||{},LAB);
window.EnvironmentKit=Object.assign({},K,{ENV,ORIG,COL,LAB:K.LAB});
window.EnvironmentDraw=window.EnvironmentDraw||{};
})();
