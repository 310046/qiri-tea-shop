# 決策紀錄

## 2026-11-20：前端技術選擇

- 狀況：目前只知道作業要做 Web 應用，還沒有課程指定語言、框架或工具資訊。
- 推薦：先用原生 HTML、CSS、JavaScript 做免安裝、單頁版本，避免在規格未知時引入額外建置負擔；若老師有指定技術，之後優先按要求移植。
- 處理：已採納此推薦，先完成可展示的核心流程。
- 待確認：課程是否要求特定技術、繳交格式或必要功能。取得課程要求後再修正方向。

## 2026-11-20：Git 推送目的地

- 狀況：目前倉庫沒有設定 Git remote，因此沒有可驗證的推送目的地。
- 推薦：由使用者提供或在 Git 設定此作業所屬的遠端倉庫，再推送目前本地提交；不要猜測帳號或建立不明目的地。
- 處理：先保留本地提交，遠端設定完成前不執行 push。

## 2026-11-20：GitHub repository 與 Pages 可見性

- 狀況：使用者要求建立 GitHub 專案並透過 Actions 發布 Pages；已連線帳號為 `310046`，建議 repository 名 `qiri-tea-shop` 尚不存在。
- 推薦：建立公開 repository 並使用 `main` 作為預設分支，因為 Pages 網站會公開且 GitHub Free 支援公開 repository 的 Pages；避免依賴付費方案或私有頁面權限。
- 處理：已採納推薦並準備自動部署 workflow。建立 repository、設定 Pages source、推送與部署驗證仍待完成。

## 2026-11-20：GitHub 登入方式

- 狀況：GitHub 連線可讀取帳號資料，但目前可用的 GitHub connector 沒有建立 repository 的操作；新開 GitHub 頁面要求登入，本機也沒有 `gh` CLI。
- 推薦：使用者在待接手的 GitHub 登入頁自行完成登入，再由目前工作流程建立專案；不在聊天或文件中索取或保存密碼／驗證碼。
- 處理：尚未建立遠端 repository；本地程式、Pages workflow 和文件已準備好。

### 執行結果（2026-11-20）

- 使用者完成 GitHub 登入後，已建立公開 `310046/qiri-tea-shop`，Pages source 設為 GitHub Actions。
- `main` 推送觸發 workflow，首輪執行成功；網站網址為 https://310046.github.io/qiri-tea-shop/。
