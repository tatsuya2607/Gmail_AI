# Gmail AI Reply

複数の Gmail アカウントを一元管理し、Claude AI で返信文を生成する個人用 Web アプリ。

受信メール → 指示を入力 → AI が返信文をストリーミング生成 → 編集 → 送信、までをブラウザで完結します。

> 個人ポートフォリオ用プロジェクト。商用リリースは想定していません ([スコープ](#スコープと注意点)参照)。

---

## このプロジェクトで示している技術

| 領域 | 内容 |
|------|------|
| **フルスタック設計** | Next.js 15 App Router + Server/Client Components の使い分け、API Routes、サーバー側 DB 操作 |
| **OAuth 2.0 + シークレット管理** | Google OAuth (offline access + refresh token), トークンを AES-256-GCM で暗号化して SQLite に保存 |
| **LLM インテグレーション** | Anthropic Claude SDK、Haiku / Sonnet のコスト/品質トレードオフを切替式 UI に落とし込み |
| **外部 API ラッパー** | Gmail API (googleapis) の listMessages / send / modify / trash、3 分メモリキャッシュ |
| **設計上のトレードオフ** | ローカル SQLite + 単一ユーザー = プライバシー優先で意図的に選択 |
| **UI/UX** | カスタム CSS (CSS変数によるテーマ管理)、ダーク/ライト対応、Gmail 風のチップ入力、可変サイズのリサイズハンドル |
| **コード品質** | TypeScript strict, ESLint 9 (flat config), 型安全な API レスポンス |

---

## 機能

### メール操作
- **複数 Gmail アカウントの一元管理** (Google OAuth 2.0)
- **受信トレイ**: スター・未読フィルター・テキスト検索・ページネーション
- **送信**: To 複数 / Cc / Bcc 対応 (Gmail 風チップ入力、ペースト一括追加)
- **新規メール作成 / 返信** (`In-Reply-To` / `References` ヘッダ自動付与)
- **ラベル管理**: 送信者ドメインやアドレスでルールベースの自動ラベル付け
- **ゴミ箱**: ローカル即時非表示 + Gmail 側 trash 同期、選択削除・復元

### AI 返信
- **Claude Haiku / Sonnet** をワンクリック切替 (軽い返信 / 重要メール)
- **テンプレート**: よく使う指示文を登録・再利用
- **ストリーミング表示**: 生成結果をタイプライター風にアニメーション
- **件名も編集可能**: AI が提案、ユーザーが上書きできる

### UI
- ダーク / ライトモード (システム連動 + 手動切替)
- 統一ヘッダー / フッター / ツールバー (Inbox・Compose・Templates 共通)
- リサイズ可能な 2 ペイン (元メール / 生成パネル)

---

## 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) — Haiku 4.5 / Sonnet 4.6 |
| Gmail | `googleapis` (公式 Node.js クライアント) |
| 認証 | Google OAuth 2.0 (offline access, prompt=consent) |
| DB | `better-sqlite3` (ローカルファイル) |
| 暗号化 | Node `crypto` — AES-256-GCM |
| スタイル | カスタム CSS (CSS変数でテーマ管理) |
| Lint | ESLint 9 (`next/core-web-vitals` + `next/typescript`) |

---

## セットアップ

### 1. リポジトリ取得

```bash
git clone git@github.com:tatsuya2607/Gmail_AI.git
cd Gmail_AI
npm install
```

### 2. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. **Gmail API** を有効化
3. OAuth 2.0 クライアント ID を作成 (種類: ウェブアプリケーション)
   - リダイレクト URI: `http://localhost:3000/api/auth/google/callback`
4. OAuth 同意画面を **Testing** に設定、使用する Gmail アカウントをテストユーザーに登録

### 3. 環境変数

`.env.local` を作成:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
ANTHROPIC_API_KEY=sk-ant-xxxxx
ENCRYPTION_KEY=<64桁の16進数文字列>
```

暗号化キーは以下で生成:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 起動

```bash
npm run dev
```

http://localhost:3000 → 「+ アカウントを追加」から Gmail を連携。

---

## 使い方

1. **アカウント追加** — トップから OAuth 認証
2. **受信トレイ** — アカウントをクリック → 最新メール一覧
3. **返信作成** — メールを開く → 「指示」欄に方向性を入力 → 「生成」(`⌘↩`) で AI 返信
4. **送信先編集** — To/Cc/Bcc をチップで管理、複数宛先対応
5. **新規メール** — 左サイドバーの「新規作成」から
6. **テンプレート** — `/templates` で指示文を管理

---

## プロジェクト構造

```
src/
├── app/
│   ├── page.tsx                  # ホーム: アカウント一覧
│   ├── account/[id]/             # 受信トレイ
│   ├── compose/[messageId]/      # 返信作成
│   ├── templates/                # テンプレート管理
│   └── api/                      # API Routes (OAuth, messages, send, reply, labels...)
├── components/                   # 全ページ共通
│   ├── AppHeader.tsx
│   ├── AppFooter.tsx
│   ├── PageToolbar.tsx
│   └── RecipientInput.tsx        # Gmail風チップ入力 (To/Cc/Bcc)
└── lib/
    ├── db.ts                     # SQLite スキーマ
    ├── crypto.ts                 # AES-256-GCM
    ├── google.ts                 # Gmail API ラッパー + キャッシュ
    └── claude.ts                 # Claude API ラッパー
```

---

## 開発コマンド

```bash
npm run dev               # 開発サーバー
npx tsc --noEmit          # 型チェック
npx eslint src            # Lint
```

---

## セキュリティ

- OAuth トークンは **AES-256-GCM** で暗号化してローカル SQLite に保存
- `.env.local` (シークレット) と `data/` (DB) は `.gitignore` で除外
- メール本文は Anthropic API に送信される (返信生成のため) — 個人利用専用の設計

---

## スコープと注意点

- **個人利用専用**。Google OAuth は Testing モードのまま運用 (一般公開・配布は想定外)
- リフレッシュトークンは Testing モードで **7 日で失効** する仕様 — ポートフォリオデモ時は再認証が必要
- マルチユーザー / クラウドデプロイ / 添付ファイル / HTML 本文編集は未対応

---

## このプロジェクトを通じて

- 「動くだけ」ではなく、設計上のトレードオフを意識して作っています:
  - **なぜローカル SQLite なのか** = プライバシーと所有権の設計判断
  - **なぜ token を暗号化しているのか** = OAuth セキュリティの基本
  - **なぜ Haiku / Sonnet を切替式にしたのか** = LLM コスト/品質トレードオフの理解
- AI 機能を後付けではなく、UX に組み込んだ実装例
- Google / Anthropic / Gmail / OAuth といった現代的なスタックを通しで扱えることを示すサンプル
