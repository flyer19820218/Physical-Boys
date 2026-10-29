/* Multiple-choice practice for weather_forecast_5.html (2026-10-28): question, hint (shown when wrong), answer (shown when right).
 * Rendered by ../biology/lesson_quiz_static_1026_v1.js. Option order is a fixed shuffle of the order written here. */
(()=>{'use strict';
const LQ=window.LessonQuiz;if(!LQ||!LQ.addStatic)return;const {P,Q}=LQ;
LQ.addStatic('weather_forecast_5',{
 '.panel:nth-child(3)':[
  Q(P(`要知道 10 公里高空的氣溫和風向，應該用哪一種觀測方法？`,`Which kind of observation tells you the temperature and wind 10 km up?`),
   [P(`地面觀測，看百葉箱`,`Surface reading from a screen box`),P(`雷達觀測，看回波強弱`,`Radar reading of the echo strength`),P(`高空觀測，放探空氣球`,`Upper-air sounding with a balloon`),P(`海面觀測，看浮標資料`,`Sea reading from a floating buoy`)],2,
   P(`無線電探空儀跟著氣球升空，一路量氣溫、氣壓、溼度與風向風速。`,`The radiosonde rises with the balloon, measuring temperature, pressure, humidity and wind all the way up.`),
   P(`哪一種觀測會真的升到高空去量？`,`Which observation really rises into the sky to measure?`)),
  Q(P(`百葉箱為什麼要漆成白色，而且四面做成百葉窗？`,`Why is a Stevenson screen painted white with louvred sides?`),
   [P(`吸收陽光又通風，量到箱子溫度`,`Absorbs sun and breathes, reads box temp`),P(`反射陽光又通風，量到空氣溫度`,`Reflects sun, breathes, reads air temp`),P(`反射陽光又密閉，量到箱子溫度`,`Reflects sun and sealed, reads box temp`),P(`吸收陽光又密閉，量到空氣溫度`,`Absorbs sun and sealed, reads air temp`)],1,
   P(`白色反射陽光，百葉窗讓空氣流通又擋住直射陽光，量到的才是空氣溫度，而不是被晒熱的箱子的溫度。`,`White reflects sunlight and the louvres let air through while blocking direct sun, so it measures air temperature, not a sun-baked box.`),
   P(`如果箱子是黑色、密不透風，溫度計量到的會是什麼的溫度？`,`If the box were black and airtight, what temperature would the thermometer read?`)),
  Q(P(`探空氣球越升越高時，為什麼會越脹越大？`,`Why does a sounding balloon swell as it rises?`),
   [P(`高處氣壓大，裡面氣體膨脹`,`Pressure is higher aloft, gas expands`),P(`高處氣壓小，裡面氣體膨脹`,`Pressure is lower aloft, gas expands`),P(`高處氣壓小，裡面氣體收縮`,`Pressure is lower aloft, gas shrinks`),P(`高處氣壓大，裡面氣體收縮`,`Pressure is higher aloft, gas shrinks`)],1,
   P(`越往高處氣壓越小，外面壓著氣球的力量變小，裡面的氣體就膨脹，氣球越來越大，最後撐破。`,`Higher up the pressure is lower, so less air presses on the balloon and the gas inside expands until the balloon bursts.`),
   P(`高空的氣壓比地面大還是小？`,`Is the pressure aloft bigger or smaller than at the ground?`))],
 '.panel:nth-child(4)':[
  Q(P(`雷達回波圖上，一片區域顯示紅色、紫色，代表什麼？`,`An area on the radar echo map shows red and purple. What does that mean?`),
   [P(`回波很強，可能有強降水`,`Strong echo; heavy rain likely`),P(`回波很弱，可能是晴朗天`,`Weak echo; clear sky is likely`),P(`回波很強，可能是晴朗天`,`Strong echo; clear sky is likely`),P(`回波很弱，可能有強降水`,`Weak echo; heavy rain is likely`)],0,
   P(`那裡回波很強，雲中的水滴、冰晶很多，可能有比較強的降水（大雨或雷雨）。`,`The echo is strong there, with lots of drops and ice crystals, so heavy rain or thunderstorms are likely.`),
   P(`回波強弱跟雲裡的什麼有關？`,`What in the cloud does echo strength depend on?`)),
  Q(P(`半夜想看颱風雲系的位置，應該看哪一種衛星雲圖？`,`In the middle of the night, which satellite image shows where the typhoon's clouds are?`),
   [P(`紅外線雲圖，量溫度晝夜皆可`,`Infrared; it senses heat day or night`),P(`可見光雲圖，靠陽光晝夜皆可`,`Visible; it uses sunlight day or night`),P(`可見光雲圖，量溫度晝夜皆可`,`Visible; it senses heat day or night`),P(`紅外線雲圖，靠陽光白天才行`,`Infrared; it needs sunlight in daytime`)],0,
   P(`紅外線雲圖量的是溫度，白天晚上都能拍；可見光雲圖要靠陽光，晚上一片黑。`,`The infrared image measures temperature so it works day and night; the visible image needs sunlight and is black at night.`),
   P(`晚上沒有陽光，哪一種雲圖還拍得到？`,`There is no sunlight at night. Which image can still be taken?`)),
  Q(P(`早上可見光雲圖上東海有一大片很白的雲，紅外線雲圖上卻幾乎看不出來。那可能是什麼？`,`On a morning visible image a large white patch covers the East China Sea but barely shows on infrared. What could it be?`),
   [P(`低雲或霧，溫度與地面相近`,`Low cloud or fog, near the ground temp`),P(`高雲或卷雲，溫度比地面低`,`High cirrus cloud, colder than ground`),P(`低雲或霧，溫度比地面低很多`,`Low cloud or fog, far colder than ground`),P(`高雲或卷雲，溫度與地面相近`,`High cirrus cloud, near ground temp`)],0,
   P(`低雲或霧很厚、反射陽光，所以可見光很白；但離地面很近、溫度與地面差不多，所以紅外線雲圖上不明顯。`,`Low cloud or fog is thick and reflects sunlight, so it is white on the visible image, but it sits near the ground at similar temperature so it barely shows on infrared.`),
   P(`紅外線雲圖上越白代表雲頂越高越冷。看不出來，表示溫度跟什麼差不多？`,`On infrared, whiter means higher and colder. Not showing means its temperature is close to what?`))],
 '.panel:nth-child(5)':[
  Q(P(`天氣預報通常會包含哪些內容？`,`What does a weather forecast usually include?`),
   [P(`最高低氣溫、降雨機率、天氣狀況`,`Highest and lowest temp, rain chance, sky`),P(`地震規模、海嘯高度、火山噴發量`,`Quake size, tsunami height, eruption volume`),P(`每日漲潮時間、月相、日出時刻`,`Daily tide times, moon phase, sunrise time`),P(`土壤成分、植物種類、河川長度`,`Soil makeup, plant species, river length`)],0,
   P(`天氣預報包含各地的最高氣溫、最低氣溫、降雨機率以及天氣狀況（晴、多雲、陰、雨等）。`,`A forecast gives each place's highest and lowest temperature, chance of rain and expected weather (sunny, cloudy, overcast, rain…).`),
   P(`回想手機上的天氣 App 會告訴你什麼。`,`Recall what a weather app on a phone tells you.`)),
  Q(P(`天氣圖上臺灣附近等壓線非常密，中心有個圈得很小的低氣壓正靠近。明天的天氣最可能是？`,`On a chart the isobars are packed near Taiwan, with a small tight low approaching. What is tomorrow's weather most likely?`),
   [P(`微風晴朗，不需要任何特報`,`Light breeze and sun, no warnings`),P(`強風乾燥，可能有大霧特報`,`Gales and dry air, a fog advisory`),P(`微風豪雨，可能有低溫特報`,`Light breeze and rain, a cold advisory`),P(`強風豪雨，可能有颱風警報`,`Gales and heavy rain, typhoon warning`)],3,
   P(`等壓線密表示風很強，圈得很小的強烈低氣壓很可能是颱風，氣象署可能發布颱風警報。`,`Tight isobars mean strong wind, and a small intense low is probably a typhoon; a typhoon warning is likely.`),
   P(`等壓線密代表什麼？圈得很小的強烈低氣壓可能是什麼？`,`What do tight isobars mean? What might a small, intense low be?`)),
  Q(P(`預報說「明天降雨機率 20 %」，代表什麼意思？`,`The forecast says "20 % chance of rain tomorrow". What does that mean?`),
   [P(`這個地方下雨機會只有 20 %`,`Only a 20 % chance of rain at this place`),P(`全臺只有 20 % 的地區會下雨`,`Only 20 % of Taiwan's area gets some rain`),P(`這個地方只會下 20 % 的時間`,`It rains for only 20 % of the time here`),P(`這個地方會下 20 毫米的雨`,`It rains for twenty millimetres in total`)],0,
   P(`降雨機率說的是這個地方在預報時段內下雨的機會只有 20 %，不太會下雨，但不能保證一定不下。`,`The rain chance means that during the forecast period there is only a 20 % chance of rain at that place: unlikely, but not impossible.`),
   P(`降雨機率說的是「某個地方」還是「多大的面積」？`,`Is rain chance about "one place" or "how large an area"?`))],
 '.panel:nth-child(6)':[
  Q(P(`某天的舒適度指數是 28，大家會覺得怎樣？`,`One day the comfort index is 28. How will people feel?`),
   [P(`寒冷，要多穿保暖衣物`,`Cold; wear extra warm clothes`),P(`舒適，不需要特別注意`,`Comfortable; no special care`),P(`悶熱，要多補充些水分`,`Muggy; drink plenty of water`),P(`稍寒，要多穿一件外套`,`Slightly cool; add a jacket on`)],2,
   P(`舒適度 28 屬於「悶熱」（27～30），要多補充水分，穿通風的衣服。`,`A comfort index of 28 is "muggy" (27–30): drink plenty and wear breathable clothes.`),
   P(`對照舒適度的六個等級表。`,`Check the table of six comfort levels.`)),
  Q(P(`紫外線指數是 9，屬於哪一級？該怎麼防護？`,`The UV index is 9. Which level is that, and what should you do?`),
   [P(`低量級，不需要做任何防曬`,`Low; no protection is needed`),P(`中量級，簡單戴帽子就足夠`,`Moderate; a simple hat is enough`),P(`過量級，不需要做任何防曬`,`Very high; no protection is needed`),P(`過量級，少出門並做好防曬`,`Very high; stay in, use sunblock`)],3,
   P(`9 屬於過量級（8～10）。上午 10 點到下午 2 點盡量少出門，出門要戴帽子、太陽眼鏡、撐傘、擦防曬，曝晒約 20 分鐘就可能晒傷。`,`9 is "very high" (8–10). Stay in as much as possible from 10 a.m. to 2 p.m.; outdoors use a hat, sunglasses, an umbrella and sunscreen, as about 20 minutes can burn.`),
   P(`8～10 是哪一級？`,`Which level is 8 to 10?`)),
  Q(P(`為什麼氣象署要發布颱風警報、豪雨特報這類消息？`,`Why does the weather administration issue typhoon warnings and heavy-rain advisories?`),
   [P(`天氣一定會造成災害，無法防範`,`Weather always causes harm; no defence`),P(`天氣可能造成災害，要提早防範`,`Weather may cause harm; so prepare early`),P(`天氣不會造成災害，只是通知`,`Weather never causes harm; just a notice`),P(`為了讓大家都能請假不上班`,`So that everyone can take days off work`)],1,
   P(`這些天氣可能造成災害，提早發布警報可以提醒民眾事先防範（例如固定門窗、避開山區河邊），減少傷害。`,`Such weather can cause disasters; early warnings let people prepare (securing windows, avoiding mountains and rivers) and reduce harm.`),
   P(`這些天氣可能造成什麼？提早知道有什麼好處？`,`What can this weather cause? What is the benefit of knowing early?`))]
});
})();
