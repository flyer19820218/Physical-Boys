# 教材檢查工具（tools/qa）

給 AI 協作者與老師自己用的檢查程式，不是教材的一部分，不會被網站載入。

## 準備

1. 啟動本機伺服器（在專案根目錄服務教材）：`tools/qa/serve.sh`
2. 需要 Node.js 與 Playwright。雲端對話環境已預裝；自己的電腦請 `npm i playwright`，並 `npx playwright install chromium`。
   找不到時可用環境變數指定：`PLAYWRIGHT_MODULE`、`CHROMIUM_PATH`、`BASE_URL`。
3. 截圖與 JSON 輸出到 `OUT_DIR`（預設 `<系統暫存>/qa-out`），不會寫進 repo。

## 工具

| 指令 | 做什麼 | 大約時間 |
|---|---|---|
| `node tools/qa/qa_page.cjs 頁面.html ...` | 每個分頁、中英文各跑一次：JS 錯誤、字體、封面無字、未定義函式、Base64／純黑／MathJax、1080px、畫布 1 秒像素差（閒置不動的會點按鈕或拖曳再量）、Hook 頭像、英文版殘留中文、控制項高度 | 每頁約 1～3 分鐘 |
| `node tools/qa/qa_text.cjs 頁面.html ...` | 攔截畫布 `fillText`：字壓字、字超出畫布、小於 13px 的字、幾乎不動的畫布 | 每頁約 30 秒 |
| `node tools/qa/smoke.cjs [頁面.html ...]` | 逐頁載入掃描：JS 錯誤、英文畫面是否還有彎撇號（不給頁面就掃全部） | 每頁約 3 秒 |
| `node tools/qa/fix_apostrophes.cjs . [--write]` | 把英文字串的彎撇號換成直撇號（預設只預覽） | 數秒 |

## 看結果的注意事項

- 「STILL」不一定是壞掉：要按按鈕或拖曳才會動的互動畫布，閒置時不動是正常的。程式會自動觸發再量，輸出的 `REACTIVE` 那行有數字就代表有反應。
- 瀏覽器自動要的 `favicon.ico` 會出現一個 404，可忽略。
- 英文版有刻意保留的中文（例如「寒流」附英文解釋）。
- 檢查結果只代表程式量得到的部分；版面好不好看，仍要看截圖。
