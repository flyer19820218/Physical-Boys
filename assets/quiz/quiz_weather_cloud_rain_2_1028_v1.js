/* Multiple-choice practice for weather_cloud_rain_2.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('weather_cloud_rain_2',{
 '.panel:nth-child(3)':[
  Q(P(`教室氣溫 25 °C，飽和水氣壓約 31.6 hPa。空氣實際含有 17.0 hPa 的水氣，相對溼度約是多少？`,`The classroom is at 25 °C, saturation vapour pressure about 31.6 hPa. The air holds 17.0 hPa of vapour. About what is the relative humidity?`),
   [P(`約 54 %，用 17.0 ÷ 31.6 算出`,`About 54 %, from 17.0 ÷ 31.6`),P(`約 86 %，用 31.6 ÷ 17.0 算出`,`About 86 %, from 31.6 ÷ 17.0`),P(`約 46 %，用 31.6 − 17.0 算出`,`About 46 %, from 31.6 − 17.0`),P(`約 19 %，用 17.0 ÷ 100 算出`,`About 19 %, from 17.0 ÷ 100`)],0,
   P(`17.0 ÷ 31.6 × 100 % ≈ 54 %。若同樣水氣加熱到 30 °C，飽和水氣壓約 42.3 hPa，相對溼度降到約 40 %。`,`17.0 ÷ 31.6 × 100 % ≈ 54 %. Warmed to 30 °C the saturation pressure is about 42.3 hPa and the relative humidity drops to about 40 %.`),
   P(`相對溼度 ＝ 實際水氣量 ÷ 飽和水氣量 × 100 %。`,`Relative humidity = actual vapour ÷ saturation vapour × 100 %.`)),
  Q(P(`房間裡的水氣量沒變，夜晚氣溫下降，相對溼度會怎麼變？`,`The vapour in a room stays the same but the temperature falls at night. What happens to relative humidity?`),
   [P(`降低，飽和水氣量變大了`,`It falls; saturation amount gets bigger`),P(`降低，實際水氣量跟著變少`,`It falls; actual vapour gets smaller too`),P(`升高，飽和水氣量變小了`,`It rises; saturation amount gets smaller`),P(`不變，水氣量沒有改變過`,`No change; vapour amount stayed the same`)],2,
   P(`氣溫下降，飽和水氣量變小（杯子變小），實際水氣量沒變，所以裝得更滿，相對溼度升高。`,`Cooling shrinks the saturation amount (a smaller cup) while the actual vapour stays put, so the cup is fuller and relative humidity rises.`),
   P(`氣溫下降，「杯子」會變大還是變小？杯裡的水變了嗎？`,`When it cools, does the "cup" get bigger or smaller? Did the water in it change?`)),
  Q(P(`夏天冰涼飲料的杯子外面會出現水珠。水珠是怎麼來的？`,`On a summer day a glass of iced drink gets water drops on the outside. Where do the drops come from?`),
   [P(`杯子裡的水從玻璃縫隙滲出來`,`Water inside leaks through the glass`),P(`杯壁溫度高使空氣中的水蒸發`,`The warm glass wall evaporates air water`),P(`杯邊的空氣降到露點以下凝結`,`Air by the glass cools below dew point`),P(`冰塊融化後水從杯口濺出來`,`Melted ice splashes out over the rim`)],2,
   P(`杯壁很冷，貼著它的空氣降到露點以下，裝不下的水氣就在外壁凝結成小水珠，不是杯裡的水滲出來。`,`The wall is cold, so air touching it falls below its dew point and the extra vapour condenses on the outside. It is not water leaking from inside.`),
   P(`杯壁附近的空氣被冰涼的杯子降溫，有沒有降到露點以下？`,`Is the air next to the cold glass cooled below its dew point?`))],
 '.panel:nth-child(4)':[
  Q(P(`地面氣溫 28 °C、露點 18 °C。用雲底高度 ≈ 125 m ×（氣溫 − 露點）估算，雲底約在多高？`,`Ground temperature 28 °C, dew point 18 °C. Using cloud base ≈ 125 m × (temperature − dew point), how high is the cloud base?`),
   [P(`約 3500 m，用 28 °C 乘 125`,`About 3500 m; 28 °C times 125`),P(`約 2250 m，用 18 °C 乘 125`,`About 2250 m; 18 °C times 125`),P(`約 1250 m，用 10 °C 乘 125`,`About 1250 m; 10 °C gap times 125`),P(`約 1125 m，用 9 °C 乘 125`,`About 125 m; just the coefficient`)],2,
   P(`溫差 28 − 18 ＝ 10 °C，雲底約 125 × 10 ＝ 1250 m。此時氣塊溫度約 28 − 9.8 × 1.25 ≈ 16 °C。`,`The gap is 28 − 18 = 10 °C, so the base is about 125 × 10 = 1250 m. The parcel is then about 28 − 9.8 × 1.25 ≈ 16 °C.`),
   P(`先算溫差 28 − 18 ＝ ？再乘以 125 m。`,`First the gap 28 − 18 = ?, then multiply by 125 m.`)),
  Q(P(`一團空氣從地面往上升時，哪一項描述正確？`,`As a parcel of air rises from the ground, which description is correct?`),
   [P(`氣壓變小、體積變大、溫度降低`,`Pressure falls, volume grows, it cools`),P(`氣壓變大、體積變小、溫度升高`,`Pressure rises, volume shrinks, it warms`),P(`氣壓變小、體積變小、溫度升高`,`Pressure falls, volume shrinks, it warms`),P(`氣壓變大、體積變大、溫度降低`,`Pressure rises, volume grows, it cools`)],0,
   P(`上升時周圍氣壓變小，空氣塊膨脹，膨脹用掉熱能，溫度降低，相對溼度升高。`,`Rising, the surrounding pressure falls, the parcel expands and uses up heat, so it cools and its relative humidity rises.`),
   P(`上升時周圍氣壓變大還是變小？膨脹時要用掉熱能，溫度會怎樣？`,`Does the surrounding pressure rise or fall as it ascends? Expanding uses heat, so what happens to temperature?`)),
  Q(P(`瓶中造雲實驗放入火柴煙粒，煙粒的功用是什麼？白霧為何在放手時出現？`,`In the cloud-in-a-bottle test, what do the smoke particles do, and why does mist appear when you let go?`),
   [P(`當凝結核；放手後空氣被壓縮變暖`,`Nuclei; letting go warms the squeezed air`),P(`提供熱量；放手後空氣膨脹變冷`,`Heat source; letting go cools the air`),P(`提供熱量；放手後空氣被壓縮變暖`,`Heat source; letting go warms the air`),P(`當凝結核；放手後空氣膨脹變冷`,`Nuclei; letting go cools the expanded air`)],3,
   P(`煙粒是凝結核。擠壓時空氣變暖不凝結；放手時空氣膨脹變冷，相對溼度超過 100 %，水氣在煙粒上凝結成白霧。`,`Smoke particles are condensation nuclei. Squeezing warms the air so nothing condenses; letting go lets it expand and cool, humidity passes 100 %, and vapour condenses on the smoke.`),
   P(`煙粒給水氣附著；擠壓和放手分別讓溫度怎麼變？`,`Smoke gives vapour something to cling to; how does temperature change on squeezing and on letting go?`))],
 '.panel:nth-child(5)':[
  Q(P(`傍晚出現高聳、像花椰菜、頂部呈鐵砧狀的暗雲，遠方有雷聲。這是哪一類雲？對流如何？`,`In the evening a tall, cauliflower-like cloud with an anvil top and dark base appears, with distant thunder. What cloud is it, and how strong is convection?`),
   [P(`積狀雲，對流非常強`,`Cumulus type; convection very strong`),P(`積狀雲，對流非常弱`,`Cumulus type; convection very weak`),P(`層狀雲，對流非常強`,`Stratus type; convection very strong`),P(`卷狀雲，對流非常弱`,`Cirrus type; convection very weak`)],0,
   P(`它是積狀雲中最高大的積雨雲，上升氣流很強，對流旺盛，所以會有雷雨。`,`It is a cumulonimbus, the tallest cumulus-type cloud; strong updrafts and vigorous convection bring thunderstorms.`),
   P(`高聳、有高低起伏，是三大類中的哪一類？`,`Tall and lumpy: which of the three families?`)),
  Q(P(`三種雲當中，哪一種出現在最高的天空、由冰晶組成？`,`Which of the three cloud families sits highest in the sky and is made of ice crystals?`),
   [P(`卷狀雲，形狀像羽毛或髮絲`,`Cirrus type, like feathers or fine hair`),P(`積狀雲，像花椰菜或棉花`,`Cumulus type, like cauliflower or cotton`),P(`層狀雲，像一整片灰色毯子`,`Stratus type, like a grey flat blanket`),P(`積雨雲，像高高聳立的鐵砧`,`Cumulonimbus, like a towering anvil top`)],0,
   P(`卷狀雲在約 5～13 km 的高空，那裡溫度很低，雲由冰晶組成。`,`Cirrus floats at about 5 to 13 km where it is very cold, and is made of ice crystals.`),
   P(`形狀像羽毛或髮絲的那一種。`,`The one shaped like feathers or hair.`)),
  Q(P(`連續幾天天空是一整片灰色平坦的雲層，下著綿綿細雨。為什麼這種天氣不容易有雷雨？`,`For days the sky is one flat grey layer with steady drizzle. Why is a thunderstorm unlikely?`),
   [P(`層狀雲對流強，上升氣流很旺盛`,`Stratus has strong convection and updrafts`),P(`層狀雲太高，水氣都變成冰晶`,`Stratus is too high, vapour all turns to ice`),P(`層狀雲太低，水氣全被地面吸收`,`Stratus is too low, ground absorbs vapour`),P(`層狀雲對流弱，上升氣流不強`,`Stratus has weak convection, weak updrafts`)],3,
   P(`平坦成層的是層狀雲，代表對流弱、雲長不高，只有細雨，不容易出現雷雨。`,`A flat layered cloud is stratus: weak convection, a shallow cloud, only drizzle, so thunderstorms are unlikely.`),
   P(`想想形狀和對流的強弱，雷雨需要很強還是很弱的上升氣流？`,`Think about shape and convection: do thunderstorms need strong or weak updrafts?`))],
 '.panel:nth-child(6)':[
  Q(P(`傍晚氣溫最低會降到 10 °C，露點是 9 °C。夜裡會起霧嗎？溫度 8 °C 的葉面會結露嗎？`,`The overnight low is 10 °C and the dew point is 9 °C. Will fog form, and will a leaf at 8 °C get dew?`),
   [P(`會起霧，葉面也會結露`,`Fog forms, and dew forms on the leaf`),P(`會起霧，但葉面不會結露`,`Fog forms, but no dew on the leaf`),P(`不起霧，葉面也不會結露`,`No fog, and no dew on the leaf`),P(`不起霧，但葉面會結露`,`No fog, but dew forms on the leaf`)],3,
   P(`空氣最低 10 °C 高於露點 9 °C，不起霧；葉面 8 °C 低於露點 9 °C，所以結露。`,`The air minimum of 10 °C is above the 9 °C dew point, so no fog; the 8 °C leaf is below it, so dew forms.`),
   P(`把溫度和露點 9 °C 比一比：高於還是低於？`,`Compare each temperature with the 9 °C dew point: above or below?`)),
  Q(P(`霰和雪的差別是什麼？`,`What is the difference between graupel and snow?`),
   [P(`雪是過冷水滴凍在冰晶上`,`Snow is the supercooled drops frozen on ice`),P(`霰是雨滴落地才結凍成冰`,`Graupel is rain that freezes on landing`),P(`霰是過冷水滴凍在冰晶上`,`Graupel is supercooled drops frozen on ice`),P(`雪是雨滴落地才結凍成冰`,`Snow is rain that freezes on landing`)],2,
   P(`霰是過冷水滴凍結附著在冰晶上形成的小冰粒；雪是冰晶長大聚集而成的雪花。`,`Graupel forms when supercooled droplets freeze onto ice crystals; snow is ice crystals grown and clumped into flakes.`),
   P(`想想形狀，以及過冷水滴碰到冰晶會發生什麼事。`,`Think of the shape, and what happens when supercooled drops hit ice crystals.`)),
  Q(P(`地面氣溫 8 °C，0 °C 等溫線在 1.2 km 高處。高空的雪落到地面時，最可能是什麼？`,`Ground temperature is 8 °C and the 0 °C line is at 1.2 km. Snow from aloft reaches the ground as what?`),
   [P(`雪，因為高空很冷`,`Snow, because the upper air is cold`),P(`冰雹，因為途中又結凍`,`Hail, because it refreezes on the way`),P(`雨，因為途中融化`,`Rain, because it melts on the way down`),P(`霰，因為途中又結凍`,`Graupel, because it refreezes on the way`)],2,
   P(`雪落到 1.2 km 以下，氣溫高於 0 °C，雪融化成雨，地面 8 °C 所以是雨。`,`Below 1.2 km the air is above 0 °C, so the snow melts into rain; with 8 °C at the ground it arrives as rain.`),
   P(`落下途中，0 °C 線以下的空氣是高於還是低於 0 °C？`,`Below the 0 °C line, is the air warmer or colder than 0 °C?`))]
});
})();
