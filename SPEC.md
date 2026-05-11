# Gmail AI Reply - プロジェクト仕様書

## 概要
複数の Gmail アカウントを一元管理し、AI で返信文を自動生成する個人用 Web アプリ。
受信メールを表示 → ユーザーの指示(プロンプト)+ テンプレートを与えて Claude に返信文を生成させる → 編集して送信、までを 1 アプリで完結させる。

## 利用者・運用前提
- 個人(作者)のみが使用。一般公開しない。
- ローカル (`localhost:3000`) で `npm run dev` 実行。
- Google OAuth は Testing モードのまま運用(審査不要)。テストユーザーとして自分の Gmail アカウントを全て登録済み。

## 技術スタック(確定済み)
- **フレームワーク**: Next.js 15+ (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **DB**: `better-sqlite3`(ローカルファイル `data/app.db`)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
  - デフォルト: `claude-haiku-4-5-20251001`(普段の返信用、安価)
  - 切替可: `claude-sonnet-4-6`(重要メール用、高品質)
- **Gmail 連携**: `googleapis`(公式 Node.js クライアント)
- **OAuth**: Google OAuth 2.0(`offline` アクセス + `prompt=consent` でリフレッシュトークン取得)

## 完了済みのセットアップ
1. ✅ Google Cloud Console で OAuth クライアント作成
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
2. ✅ Gmail API 有効化
3. ✅ OAuth 同意画面: External / Testing モード / テストユーザー登録済み
4. ✅ Anthropic API キー取得
5. ✅ Next.js プロジェクト作成済み(`gmail-ai-reply/`)
6. ✅ 依存パッケージインストール済み:
   - `googleapis`, `@anthropic-ai/sdk`, `better-sqlite3`, `@types/better-sqlite3`

## 環境変数(`.env.local` に設定済み)
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
ANTHROPIC_API_KEY=sk-ant-xxxxx
ENCRYPTION_KEY=xxx (64桁の hex 文字列、AES-256-GCM 用)
```

## 必要な OAuth スコープ
- `https://www.googleapis.com/auth/gmail.readonly` — メール読み取り
- `https://www.googleapis.com/auth/gmail.send` — メール送信
- `https://www.googleapis.com/auth/userinfo.email` — アカウント識別用
- `https://www.googleapis.com/auth/userinfo.profile` — 表示名取得用(任意)

## 想定ファイル構造

```
src/
├── app/
│   ├── page.tsx                              # トップ: アカウント一覧 + 追加ボタン
│   ├── account/[id]/page.tsx                 # 受信トレイ
│   ├── compose/[messageId]/page.tsx          # 返信作成画面
│   ├── templates/page.tsx                    # テンプレート管理
│   └── api/
│       ├── auth/google/route.ts              # GET: OAuth開始(認可画面へリダイレクト)
│       ├── auth/google/callback/route.ts     # GET: コールバック → トークン保存
│       ├── accounts/route.ts                 # GET: 一覧 / DELETE: 削除
│       ├── messages/route.ts                 # GET: メール一覧(?accountId=)
│       ├── messages/[id]/route.ts            # GET: メール詳細
│       ├── reply/route.ts                    # POST: AI で返信生成
│       ├── send/route.ts                     # POST: メール送信
│       └── templates/route.ts                # CRUD
└── lib/
    ├── db.ts                                 # SQLite 初期化・接続
    ├── crypto.ts                             # AES-256-GCM 暗号化
    ├── google.ts                             # OAuth クライアント・Gmail API ラッパー
    └── claude.ts                             # Claude API ラッパー
```

## DB スキーマ

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,              -- email アドレスをそのまま PK に
  email TEXT NOT NULL,
  name TEXT,
  access_token TEXT NOT NULL,       -- 暗号化済み
  refresh_token TEXT NOT NULL,      -- 暗号化済み
  expires_at INTEGER NOT NULL,      -- unix ms
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,               -- 「丁寧な断り」「カジュアル承諾」など
  prompt TEXT NOT NULL,             -- AI への指示文
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 実装フェーズ(MVP優先・上から順に)

### Phase 1: 基盤ライブラリ
1. `src/lib/db.ts` — SQLite 初期化、`data/` ディレクトリ自動作成、テーブル作成
2. `src/lib/crypto.ts` — `ENCRYPTION_KEY` を使って AES-256-GCM で暗号化/復号
3. `src/lib/google.ts` — `OAuth2Client` 生成、トークンリフレッシュ、Gmail API 呼び出しヘルパー
4. `src/lib/claude.ts` — Claude API 呼び出しヘルパー(モデル切替対応)

### Phase 2: OAuth フロー
5. `GET /api/auth/google` — 認可URL生成 → リダイレクト(`access_type=offline`, `prompt=consent`)
6. `GET /api/auth/google/callback` — code → トークン交換 → user email 取得 → DB upsert
7. `/`(トップ) — アカウント一覧表示、「アカウント追加」ボタン

### Phase 3: メール表示
8. `GET /api/accounts` — DB から一覧返す(トークンは含めない)
9. `GET /api/messages?accountId=...` — Gmail API で INBOX 最新20件取得
10. `/account/[id]` — 受信トレイ UI(送信者・件名・日時・スニペット)、アカウント切替ドロップダウン

### Phase 4: AI 返信生成と送信
11. `GET /api/messages/[id]?accountId=...` — メール詳細(本文 + ヘッダ情報)
12. `POST /api/reply` — body: `{ messageId, accountId, userPrompt, templateId?, model? }` → Claude で生成
13. `/compose/[messageId]` — 元メール表示、指示入力、テンプレ選択、モデル選択、生成、編集、送信
14. `POST /api/send` — body: `{ accountId, to, subject, body, inReplyTo, references }` → Gmail API で送信

### Phase 5: テンプレート管理
15. `GET/POST/PUT/DELETE /api/templates`
16. `/templates` — 一覧・追加・編集・削除UI

## 重要な実装上の注意点

### セキュリティ
- リフレッシュトークン・アクセストークンは **必ず** AES-256-GCM で暗号化して DB に保存
- `data/app.db` と `.env.local` を `.gitignore` に追加
- `data/` ディレクトリは `db.ts` 初回ロード時に存在しなければ作成

### Gmail API 実装の落とし穴
- **本文抽出**: メールは MIME マルチパート。`payload.parts` を再帰探索して `text/plain`(なければ `text/html`)を抽出。
- **Base64 デコード**: Gmail は URL-safe Base64(`-` `_`)を返すので、`+` `/` に変換してから `Buffer.from(s, 'base64')`。
- **スレッド維持**: 返信時は元メールの `Message-ID` ヘッダを取得し、新しいメールの `In-Reply-To` と `References` に設定。
- **件名**: 元の件名に `Re: ` プレフィックス(既に `Re: ` が付いていれば追加しない)。
- **送信形式**: `users.messages.send` には RFC 5322 形式のメッセージを base64url で渡す。`threadId` も指定するとスレッド維持できる。

### トークン管理
- アクセストークンは 1 時間で失効。
- API 呼び出し前に `expires_at` をチェック、切れていれば `OAuth2Client.refreshAccessToken()` で更新。
- 更新後の新しい `access_token` と `expires_at` を DB に書き戻す。
- `googleapis` の `OAuth2Client` は `on('tokens')` イベントで新トークンが取れるので、それを使うのが綺麗。

### Claude API 呼び出し設計
システムプロンプト例:
```
あなたはユーザーのメール返信を代筆するアシスタントです。
以下を踏まえて自然で適切な返信本文を日本語で生成してください:
- 元メールの文脈と相手との関係性
- ユーザーからの指示(トーン・内容の方向性)
- 指定があればテンプレート

出力は本文のみ。署名・件名は含めない。
冒頭の挨拶と結びは自然に含めてよい。
```

ユーザーメッセージは以下のように構造化:
```
# 元メール
差出人: ...
件名: ...
本文:
...

# 指示
{ユーザー入力}

# テンプレート(任意)
{テンプレ内容}
```

### UI 設計方針
- 装飾よりも実用性。Tailwind で清潔感あるレイアウト。
- ダークモード対応(`dark:` プレフィックス)。
- アカウント切替: 受信トレイ画面上部のドロップダウン。
- 返信生成中はローディング表示、生成失敗時はエラー文言。
- 「再生成」ボタンで生成し直し可能。

## スコープ外(やらないこと)
- マルチユーザー対応(個人用)
- メール検索機能(最新20件で十分)
- 添付ファイル対応
- 下書き保存(生成→即編集→送信のフローのみ)
- カレンダー連携
- 本番デプロイ(localhost のみ)
- メール受信通知

## 開発時の Claude Code への依頼例

最初にこのファイルを読ませて、以下のように頼むと進めやすいです:

> `SPEC.md` を読んで、Phase 1 の `src/lib/` 配下 4 ファイルを作成してください。
> 各ファイルは独立して動作確認できるよう、最後に簡単な疑似テストコメントを付けてください。

フェーズごとに区切って依頼すると、エラー時の切り分けがしやすいです。
