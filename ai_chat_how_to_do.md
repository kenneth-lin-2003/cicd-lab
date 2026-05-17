可以，這份作業主要是在 **fork 後的 repo 裡新增 GitHub Actions CI 檔案**，然後截圖寫報告。原始專案是 Node/TypeScript 專案，`package.json` 已經有這幾個 script：`typecheck`、`test`、`format:check`，所以 CI 可以直接呼叫它們。([GitHub][1])

---

## 1. 先 Fork 專案

到這個 repo：

[https://github.com/yubinTW/cicd-lab](https://github.com/yubinTW/cicd-lab)

按右上角 **Fork**，建立自己的 repo。原始 README 也要求先 fork，然後在自己的 fork repo 裡操作。([GitHub][2])

然後 clone 你的 fork：

```bash
git clone https://github.com/你的GitHub帳號/cicd-lab.git
cd cicd-lab
```

安裝套件：

```bash
npm ci
```

---

## 2. 新增 CI 檔案

假設你的學號是 `b11902024`，就建立：

```bash
mkdir -p .github/workflows
touch .github/workflows/ci_b11902024.yaml
```

把下面內容貼進去，記得把檔名改成你的學號。

```yaml
name: CI b11902024

on:
  push:
    branches:
      - '**'
  pull_request:

jobs:
  quality-check:
    name: Typecheck, Format, and Test
    runs-on: ubuntu-latest

    permissions:
      contents: read
      checks: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v5
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript typecheck
        run: npm run typecheck

      - name: Prettier check
        run: npm run format:check

      - name: Run tests and generate JUnit report
        run: |
          mkdir -p reports
          npm test -- --reporter=default --reporter=junit --outputFile.junit=reports/vitest-junit.xml

      - name: Upload test report artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: vitest-junit-report
          path: reports/vitest-junit.xml
          if-no-files-found: warn
```

這份 YAML 符合作業要求：

| 作業要求                   | 對應 YAML                                                     |
| -------------------------- | ------------------------------------------------------------- |
| push 自動執行              | `on: push`                                                    |
| TypeScript typecheck       | `npm run typecheck`                                           |
| Prettier check             | `npm run format:check`                                        |
| Test                       | `npm test`                                                    |
| 任一失敗則 pipeline failed | GitHub Actions 預設只要某個 step exit code 非 0，job 就會失敗 |
| 測試結果呈現               | 產生 `reports/vitest-junit.xml`，並用 artifact 上傳           |

`setup-node` 可以設定 Node.js 版本，也支援 npm cache；`upload-artifact` 可把 workflow 產生的檔案上傳成 GitHub Actions artifact。([GitHub][3])

---

## 3. Commit 並 Push

```bash
git add .github/workflows/ci_b11902024.yaml
git commit -m "ci: add homework pipeline"
git push origin main
```

如果你在 branch 做：

```bash
git checkout -b feature/cicd-homework
git add .github/workflows/ci_b11902024.yaml
git commit -m "ci: add homework pipeline"
git push origin feature/cicd-homework
```

因為 YAML 有：

```yaml
on:
  push:
    branches:
      - '**'
```

所以推到任何 branch 都會觸發。

---

## 4. 到 GitHub Actions 看結果

到你的 GitHub repo：

1. 點上方 **Actions**
2. 找到 `CI b11902024`
3. 點進最新的一次 run
4. 確認這些 step 都成功：
   - `TypeScript typecheck`
   - `Prettier check`
   - `Run tests and generate JUnit report`
   - `Upload test report artifact`

成功畫面要截圖，報告裡要放。

---

## 5. 故意製造失敗案例

你可以選一種最簡單的做法。

### 方法 A：製造 TypeScript 型別錯誤

打開某個 `.ts` 檔案，例如 `src/server.ts`，加入：

```ts
const wrongType: string = 123;
```

然後：

```bash
git add .
git commit -m "test: create type error"
git push origin main
```

GitHub Actions 應該會在 `TypeScript typecheck` 失敗。

修正方式：把錯誤刪掉，或改成：

```ts
const wrongType: string = '123';
```

---

### 方法 B：製造 Prettier 格式錯誤

找一個 `.ts` 檔案，把格式弄亂，例如：

```ts
const x = { a: 1, b: 2 };
```

然後 push。
CI 應該會在 `Prettier check` 失敗。

修正方式：

```bash
npm run format
git add .
git commit -m "style: fix prettier format"
git push origin main
```

---

### 方法 C：製造測試失敗

找 `test/` 裡面的測試，把 expected 改錯，例如原本期待 `200`，改成 `500`。

然後：

```bash
git add .
git commit -m "test: create failing test"
git push origin main
```

CI 應該會在 `Run tests and generate JUnit report` 失敗。

修正方式：把測試改回正確 expected。

---

## 6. 報告可以這樣寫

PDF 內容建議分成這幾段：

```md
# CI/CD 作業報告

## 一、CI Pipeline 說明

本次作業基於 yubinTW/cicd-lab 專案進行實作，新增 `.github/workflows/ci_b11902024.yaml` 作為 GitHub Actions workflow。Pipeline 設定於 push 與 pull_request 時自動執行，目的是在程式碼進入 repository 後自動進行品質檢查。

Pipeline 包含三個主要檢查項目：

1. TypeScript typecheck：使用 `npm run typecheck` 檢查 TypeScript 型別是否正確。
2. Prettier check：使用 `npm run format:check` 檢查程式碼格式是否符合 Prettier 規範。
3. Test：使用 `npm test` 執行 Vitest 測試，並產生 JUnit 格式測試報告。

若任一檢查失敗，GitHub Actions job 會回傳 failed，藉此達到錯誤阻斷效果。

## 二、ci_b11902024.yaml 主要內容

貼上你的 YAML。

## 三、工具與策略

本次使用 GitHub Actions 作為 CI 平台，使用 `actions/checkout` 取得 repository 原始碼，使用 `actions/setup-node` 建立 Node.js 22 環境，並使用 `npm ci` 安裝依賴，以確保安裝結果與 package-lock.json 一致。

測試結果透過 Vitest 的 JUnit reporter 輸出成 `reports/vitest-junit.xml`，再使用 `actions/upload-artifact` 將測試報告上傳到 GitHub Actions 結果頁面，方便檢查測試結果。

## 四、成功執行結果

貼上 GitHub Actions 成功執行截圖。

說明：
可以看到 TypeScript typecheck、Prettier check、Test 皆成功通過，因此整個 workflow 顯示 success。

## 五、失敗案例說明

本次故意製造 TypeScript 型別錯誤，例如：

const wrongType: string = 123;

此錯誤會造成 `npm run typecheck` 失敗，因此 GitHub Actions workflow 顯示 failed。

貼上 failed 截圖。

修正方式：
將錯誤改為：

const wrongType: string = "123";

或刪除該測試錯誤後重新 push，CI 即可恢復成功。
```

---

## 7. 最後輸出 PDF

檔名要像這樣：

```text
b11902024_林楷瀚_CICD_作業.pdf
```

注意學號要小寫，因為作業說明要求檔名格式是：

```text
學號_姓名_CICD_作業.pdf
```

作業截止時間是 **2026 年 5 月 18 日 23:59**；HackMD 頁面也寫繳交時間為 **5/19 0:00**，實際上就是 5/18 晚上 23:59 前後要交。([HackMD][4])

[1]: https://raw.githubusercontent.com/yubinTW/cicd-lab/main/package.json 'raw.githubusercontent.com'
[2]: https://github.com/yubinTW/cicd-lab 'GitHub - yubinTW/cicd-lab · GitHub'
[3]: https://github.com/actions/setup-node?utm_source=chatgpt.com 'GitHub - actions/setup-node: Set up your ...'
[4]: https://hackmd.io/%40sychen6192/HJv9-CHCZe '2026 CI/CD Homework - HackMD'
