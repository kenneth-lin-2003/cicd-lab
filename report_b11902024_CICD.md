# `b11902024_姓名_CICD_作業`

## 一、CI Pipeline 說明

本次作業在專案中新增 `.github/workflows/ci_b11902024.yaml`，使用 GitHub Actions 建立 CI pipeline。此 pipeline 會在 push 到任一 branch 時自動執行，也支援 pull request 事件，目的是在程式碼進入 repository 後自動檢查型別、格式與測試結果。

Workflow 主要內容如下：

```yaml
name: CI b11902024

on:
  push:
    branches:
      - '**'
  pull_request:

jobs:
  quality-check:
    name: Typecheck, format, and test
    runs-on: ubuntu-latest

    permissions:
      contents: read
      checks: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

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

      - name: Publish test results
        if: always() && hashFiles('reports/vitest-junit.xml') != ''
        uses: dorny/test-reporter@v2
        with:
          name: Vitest Test Results
          path: reports/vitest-junit.xml
          reporter: java-junit

      - name: Upload test report artifact
        if: always() && hashFiles('reports/vitest-junit.xml') != ''
        uses: actions/upload-artifact@v4
        with:
          name: vitest-junit-report
          path: reports/vitest-junit.xml
```

Pipeline 設計包含以下步驟：

1. Checkout repository：使用 `actions/checkout@v4` 取得 repository 原始碼。
2. Setup Node.js：使用 `actions/setup-node@v4` 安裝 Node.js 22，並啟用 npm cache，加速後續安裝。
3. Install dependencies：使用 `npm ci` 依照 `package-lock.json` 安裝固定版本依賴，確保 CI 環境可重現。
4. TypeScript typecheck：使用 `npm run typecheck` 執行 `tsc --noEmit`，檢查 TypeScript 型別。
5. Prettier check：使用 `npm run format:check` 檢查程式碼格式是否符合 Prettier 規範。
6. Test：使用 `npm test` 執行 Vitest 測試，並額外輸出 JUnit XML 測試報告。
7. Publish test results：使用 `dorny/test-reporter@v2` 將 JUnit 測試結果顯示在 GitHub Actions 結果頁面。
8. Upload test report artifact：使用 `actions/upload-artifact@v4` 上傳 `reports/vitest-junit.xml`，方便下載與檢查。

只要 TypeScript typecheck、Prettier check 或測試其中任一步驟失敗，該 step 會回傳非 0 exit code，GitHub Actions job 會被標記為 failed。因此這個 pipeline 可以阻擋型別錯誤、格式錯誤與測試失敗的程式碼。

## 二、CI 執行結果截圖

成功執行後，GitHub Actions 頁面會顯示 workflow `CI b11902024` 執行成功，且以下步驟皆為成功狀態：

- TypeScript typecheck
- Prettier check
- Run tests and generate JUnit report
- Publish test results
- Upload test report artifact

請在此處放入至少一張成功執行截圖：

`[放入 GitHub Actions 成功執行截圖]`

## 三、失敗案例說明

本次失敗案例使用三種常見錯誤進行驗證：TypeScript 型別錯誤、Prettier 格式錯誤，以及測試失敗。每個案例都會先 push 錯誤版本讓 GitHub Actions pipeline failed，再修正錯誤並重新 push，確認 pipeline 恢復成功。

### 案例一：TypeScript 型別錯誤

故意在 `src/server.ts` 或其他 `.ts` 檔案中加入以下程式碼：

```ts
const wrongType: string = 123;
```

此程式碼將 number 指派給 string 變數，不符合 TypeScript 型別規則。push 後，GitHub Actions 會在 `TypeScript typecheck` step 執行 `npm run typecheck` 時失敗，pipeline 會被標記為 failed。

失敗原因：

- `wrongType` 宣告為 `string`
- 實際賦值為 `123`
- TypeScript 偵測到 `number` 不能指派給 `string`

修正方式為刪除錯誤程式碼，或將賦值改成字串：

```ts
const wrongType: string = '123';
```

請在此處放入 pipeline failed 截圖：

`[放入 TypeScript typecheck failed 截圖]`

修正後再次 push，CI pipeline 應恢復成功狀態。

### 案例二：Prettier 格式錯誤

故意在 `.ts` 檔案中加入不符合 Prettier 格式的程式碼，例如：

```ts
const prettierFailure = { message: 'bad format' };
```

將它改成單行並故意移除必要空白或排版後 push，GitHub Actions 會在 `Prettier check` step 執行 `npm run format:check` 時失敗。

失敗原因：

- 程式碼格式不符合 Prettier 規範
- `prettier --check .` 偵測到檔案需要重新格式化
- Prettier 回傳非 0 exit code，因此 pipeline failed

修正方式為執行：

```bash
npm run format
```

或手動將程式碼排版成 Prettier 接受的格式，再次 push 後 pipeline 應恢復成功。

請在此處放入 pipeline failed 截圖：

`[放入 Prettier check failed 截圖]`

### 案例三：測試失敗

故意修改 `test/app.test.ts` 的預期結果，例如將：

```ts
expect(response.statusCode).toBe(200);
```

改成：

```ts
expect(response.statusCode).toBe(500);
```

此時測試期待 HTTP status code 為 500，但實際 API 回傳 200。push 後，GitHub Actions 會在 `Run tests and generate JUnit report` step 執行 Vitest 時失敗。

失敗原因：

- 測試預期值與實際結果不一致
- `/health` endpoint 實際回傳 HTTP 200
- 測試故意期待 HTTP 500，導致 assertion failed

修正方式為將測試預期值改回：

```ts
expect(response.statusCode).toBe(200);
```

修正後再次 push，CI pipeline 應恢復成功。

請在此處放入 pipeline failed 截圖：

`[放入 Test failed 截圖]`

## 四、使用工具與策略

本次實作使用 GitHub Actions 作為 CI 平台，並使用專案既有的 npm scripts 進行品質檢查。TypeScript typecheck 用於確認型別正確性，Prettier check 用於維持程式碼格式一致，Vitest 用於執行自動化測試。測試結果透過 JUnit XML 格式輸出，再由 `dorny/test-reporter@v2` 顯示於 GitHub Actions 結果頁面，並透過 artifact 保存測試報告檔案。

此策略能在每次 push 時自動驗證程式碼品質，讓錯誤在合併或部署前被提早發現。
