# Tiny English Tree · 0~3歲英文啟蒙儀表板

給大人用的分齡英文啟蒙工具，目前涵蓋 0~1歲、1~2歲、2~3歲三個階段。每個階段都有「分級口說教材」「延伸資源連結」「本週活動建議」「進度追蹤」四個區塊。

## 這是什麼、不是什麼

- 這是**給家長看/用**的儀表板，不是給小小孩自己操作的App。
- 裡面的單字、短句、疊句小故事都是**原創內容**，只是參考了 Oxford Reading Tree（牛津閱讀樹）由淺入深、句型可預測的分級邏輯，以及 BBC 兒童內容慢語速、高重複性的設計原則——**沒有複製**任何 ORT 書籍內文/插圖或 BBC 影音內容。
- 真正的 ORT 繪本、BBC 節目，請透過各分頁「延伸資源」裡的官方連結前往官網使用（部分需要免費註冊或訂閱）。

## 檔案結構

```
pwa/
├── index.html      主要頁面（HTML + CSS + JS 都在這個檔案裡）
├── manifest.json    PWA 設定檔（App 名稱、圖示、顏色）
├── sw.js             Service Worker（離線快取、可安裝性）
├── icons/            App 圖示
└── README.md         就是這份說明
```

## 目前先在瀏覽器打開就能用

直接雙擊 `index.html` 或用任何靜態伺服器打開都能瀏覽內容。但「加到手機主畫面」跟「進度自動保存」這兩個功能，**需要透過 HTTPS 網址正式架設**才會完整生效（瀏覽器安全限制，本機檔案或部分預覽環境無法註冊 Service Worker / 使用完整儲存空間）。

## 免費上線方法（擇一，約5~10分鐘）

### 方法一：Cloudflare Pages（推薦，免費、有 HTTPS、速度快）
1. 前往 [pages.cloudflare.com](https://pages.cloudflare.com/) 註冊/登入
2. 選擇「Upload assets」（直接上傳檔案，不需要 Git）
3. 把整個 `pwa` 資料夾內的檔案（含 `icons/` 子資料夾）拖進去上傳
4. 上傳完成會拿到一個 `https://xxxx.pages.dev` 的網址
5. 用手機瀏覽器打開這個網址 → 加入主畫面，就是一個可安裝的 App 了

### 方法二：Netlify Drop（同樣免費、更快）
1. 前往 [app.netlify.com/drop](https://app.netlify.com/drop)
2. 把整個 `pwa` 資料夾拖進網頁畫面
3. 幾秒後會拿到一個 `https://xxxx.netlify.app` 網址

### 方法三：GitHub Pages
1. 建一個新的 GitHub repository，把 `pwa` 資料夾內容全部上傳
2. 到 repository 的 Settings → Pages，選擇要發布的分支
3. 幾分鐘後會拿到 `https://你的帳號.github.io/repo名稱/` 網址

### 方法四：Cloudflare Workers（Wrangler CLI，適合已經有 Cloudflare 帳號/習慣用指令列的人）
資料夾裡已經附上 `wrangler.jsonc`，設定成把整個 `pwa/` 當作靜態資源直接發布，不需要另外寫程式。
1. 安裝 Node.js 後，在 `pwa/` 資料夾裡執行 `npx wrangler login`（第一次會跳出瀏覽器登入 Cloudflare 帳號）
2. 執行 `npx wrangler deploy`
3. 完成後會拿到一個 `https://tiny-english-tree.你的帳號.workers.dev` 網址
4. 之後要更新內容，只要在同一個資料夾再跑一次 `npx wrangler deploy` 就會覆蓋上線版本

上線後把網址記下來，之後可以隨時回來看、更新、或分享給其他人（例如另一位照顧者）。

## 之後想擴充的方向（先記錄，之後有需要再做）

- 依你手邊實際購入的 ORT 書籍/BBC 訂閱，客製化「延伸資源」對照表
- 加入照片/筆記的紀錄功能（需要簡易後端資料庫）
- 3歲以上銜接更完整的分級閱讀進度
