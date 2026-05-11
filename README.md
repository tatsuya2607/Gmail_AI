# Gmail AI Reply

複数の Gmail アカウントを一元管理し、Claude AI で返信文を自動生成する個人用 Web アプリ。

受信メールを表示 → 指示を入力 → AI が返信文を生成 → 編集して送信、までをブラウザ上で完結できます。

![compose UI](https://github.com/tatsuya2607/Gmail_AI/assets/compose-preview.png)

---

## 機能

- **複数 Gmail アカウント管理** — Google OAuth 2.0 で認証、トークンは AES-256-GCM で暗号化して保存
- **受信トレイ表示** — 各アカウントの INBOX 最新 20 件を一覧表示
- **AI 返信生成** — Claude Haiku（高速・低コスト）と Claude Sonnet（高品質）を切り替え可能
- **ストリーミング表示** — 生成結果をタイプライター風にアニメーション表示
- **テンプレート管理** — よく使う指示文をテンプレートとして保存・再利用
- **スレッド維持** — `In-Reply-To` / `References` ヘッダを自動設定してスレッドを崩さない

---

## 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| スタイリング | Tailwind CSS + カスタム CSS |
| データベース | better-sqlite3（ローカル SQLite） |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Gmail 連携 | googleapis（公式 Node.js クライアント） |
| 認証 | Google OAuth 2.0（offline access） |

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone git@github.com:tatsuya2607/Gmail_AI.git
cd Gmail_AI
npm install
```

### 2. Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. **Gmail API** を有効化
3. OAuth 2.0 クライアント ID を作成（種類: ウェブアプリケーション）
   - 承認済みリダイレクト URI: `http://localhost:3000/api/auth/google/callback`
4. OAuth 同意画面を **テストモード** に設定し、使用する Gmail アカウントをテストユーザーに追加

### 3. 環境変数を設定

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
```

`.env.local` を編集:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
ANTHROPIC_API_KEY=sk-ant-xxxxx
ENCRYPTION_KEY=<64桁の16進数文字列>
```

`ENCRYPTION_KEY` は以下のコマンドで生成できます:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 起動

```bash
npm run dev
```

http://localhost:3000 を開き、「+ アカウントを追加」から Gmail アカウントを連携してください。

---

## 使い方

1. **アカウント追加** — トップページの「+ アカウントを追加」から Google 認証
2. **受信トレイ** — アカウントをクリックして最新メールを確認
3. **返信作成** — メールをクリックして返信画面を開く
   - 「指示」欄に返信の方向性を入力（例: _丁寧にお断りする。来週なら都合がよいと伝える。_）
   - テンプレートやモデル（Haiku / Sonnet）を選択
   - 「生成」ボタン（または `⌘↩`）で AI が返信文を生成
   - 必要に応じて編集してから「送信」
4. **テンプレート管理** — `/templates` でよく使う指示文を登録・編集

---

## プロジェクト構造

```
src/
├── app/
│   ├── page.tsx                          # トップ: アカウント一覧
│   ├── account/[id]/page.tsx             # 受信トレイ
│   ├── compose/[messageId]/
│   │   ├── page.tsx                      # 返信作成画面（サーバーコンポーネント）
│   │   ├── compose.css                   # フルスクリーン UI のカスタム CSS
│   │   └── _components/ComposeClient.tsx # インタラクティブな返信作成 UI
│   ├── templates/page.tsx                # テンプレート管理
│   └── api/
│       ├── auth/google/route.ts          # OAuth 開始
│       ├── auth/google/callback/route.ts # OAuth コールバック
│       ├── accounts/route.ts             # アカウント CRUD
│       ├── messages/route.ts             # メール一覧
│       ├── messages/[id]/route.ts        # メール詳細
│       ├── reply/route.ts                # AI 返信生成
│       ├── send/route.ts                 # メール送信
│       └── templates/route.ts           # テンプレート CRUD
└── lib/
    ├── db.ts                             # SQLite 初期化
    ├── crypto.ts                         # AES-256-GCM 暗号化
    ├── google.ts                         # Gmail API ラッパー
    └── claude.ts                         # Claude API ラッパー
```

---

## セキュリティについて

- OAuth トークンは AES-256-GCM で暗号化してローカル SQLite に保存
- `.env.local`（シークレット）と `data/`（DB）は `.gitignore` で除外済み
- 個人利用専用。Google OAuth は Testing モードのまま運用（一般公開しない）

---

## スコープ外

- マルチユーザー対応
- メール検索
- 添付ファイル対応
- 本番デプロイ
