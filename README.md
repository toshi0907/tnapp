# TN API Server

Node.js で構築されたシンプルなAPIサーバです。

## 機能

- Express.js ベースのRESTful API
- **JSONファイル永続化**によるデータ保存
- CORS サポート
- セキュリティヘッダー（Helmet）
- 環境変数管理（dotenv）
- ヘルスチェックエンドポイント
- ユーザーAPI（CRUD操作対応）
- **ブックマーク管理API**（CRUD操作、検索、カテゴリ・タグ機能対応）
- **TODO管理API**（CRUD操作、優先度・カテゴリ・タグ機能対応）
- **リマインダー管理API**（スケジューリング、通知、日本語日付形式対応）
- **Swagger UI API仕様書**（インタラクティブなAPI仕様書）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして、必要に応じて設定を変更してください。

```bash
cp .env.example .env
```

`.env`ファイルの例：
```bash
PORT=3000
NODE_ENV=development

# リマインダー通知設定
WEBHOOK_URL=https://webhook.site/your-webhook-url

# メール設定（Gmail SMTP）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_AUTH_METHOD=PLAIN
SMTP_REQUIRE_TLS=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=notification@example.com
```

#### Gmailアプリパスワードの設定方法

リマインダー機能でGmailを使用してメール通知を送信するには、Googleアカウントの**アプリパスワード**が必要です。通常のGoogleアカウントのパスワードは使用できません。

**前提条件:**
- Googleアカウントで2段階認証が有効になっている必要があります

**アプリパスワード生成手順:**

1. **Googleアカウント管理画面にアクセス**
   - https://myaccount.google.com/ にアクセス
   - Googleアカウントにログイン

2. **セキュリティ設定を開く**
   - 左側メニューから「セキュリティ」をクリック
   - または https://myaccount.google.com/security に直接アクセス

3. **2段階認証を確認・有効化**
   - 「Googleへのログイン」セクションで「2段階認証プロセス」をクリック
   - 2段階認証が無効の場合は、まず有効にしてください

4. **アプリパスワードを生成**
   - 2段階認証設定画面で「アプリパスワード」をクリック
   - パスワードを再入力
   - 「アプリを選択」で「メール」を選択
   - 「デバイスを選択」で「その他（名前を入力）」を選択
   - アプリ名として「TN API Server」などを入力
   - 「生成」をクリック

5. **生成されたパスワードを設定**
   - 16文字のアプリパスワードが表示されます（例：`abcd efgh ijkl mnop`）
   - このパスワードを `.env` ファイルの `SMTP_PASS` に設定：
     ```bash
     SMTP_PASS=abcdefghijklmnop
     ```
   - **注意**: スペースは含めずに入力してください

**設定例:**
```bash
# .env ファイルの設定例
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=your-account@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=your-account@gmail.com
EMAIL_TO=notifications@example.com
```

**トラブルシューティング:**
- アプリパスワードの選択肢が表示されない場合は、2段階認証が正しく設定されているか確認してください
- メール送信に失敗する場合は、Gmail側のセキュリティ設定や送信制限を確認してください
- `.env` ファイルにスペースや余分な文字が含まれていないか確認してください

### 3. サーバーの起動

#### 開発モード（ホットリロード付き）
```bash
npm run dev
```

#### 本番モード
```bash
npm start
```

## API仕様書

このAPIサーバーには**Swagger UI**によるインタラクティブなAPI仕様書が提供されています。

### Swagger UI
- **URL**: http://localhost:3000/api-docs
- **機能**: 
  - 全APIエンドポイントの詳細仕様
  - リクエスト・レスポンスの例
  - インタラクティブなAPIテスト機能
  - データスキーマの詳細表示

サーバー起動後、ブラウザで `http://localhost:3000/api-docs` にアクセスすると、視覚的でインタラクティブなAPI仕様書を確認できます。

## データ永続化

ブックマークデータは `data/bookmarks.json` ファイルに、TODOデータは `data/todos.json` ファイルに、リマインダーデータは `data/reminders.json` ファイルに保存されます。サーバー再起動後もデータは保持されます。

## API エンドポイント

詳細なAPI仕様については、**Swagger UI**をご確認ください: http://localhost:3000/api-docs

### 主要エンドポイント一覧

#### システム
- `GET /health` - ヘルスチェック
- `GET /api/hello` - テスト用エンドポイント

#### ブックマーク管理
- `GET /api/bookmarks` - ブックマーク一覧取得（検索・フィルタ対応）
- `POST /api/bookmarks` - 新規ブックマーク作成
- `GET /api/bookmarks/:id` - 特定ブックマーク取得
- `PUT /api/bookmarks/:id` - ブックマーク更新
- `DELETE /api/bookmarks/:id` - ブックマーク削除
- `GET /api/bookmarks/meta/*` - メタデータ取得（カテゴリ・タグ・統計）

#### TODO管理
- `GET /api/todos` - TODO一覧取得（フィルタ対応）
- `POST /api/todos` - 新規TODO作成
- `GET /api/todos/:id` - 特定TODO取得
- `PUT /api/todos/:id` - TODO更新
- `DELETE /api/todos/:id` - TODO削除
- `PATCH /api/todos/:id/toggle` - 完了状態切り替え
- `GET /api/todos/meta/*` - メタデータ取得（カテゴリ・タグ・統計）

#### リマインダー管理
- `GET /api/reminders` - リマインダー一覧取得（フィルタ・検索対応）
- `POST /api/reminders` - 新規リマインダー作成
- `GET /api/reminders/:id` - 特定リマインダー取得
- `PUT /api/reminders/:id` - リマインダー更新
- `DELETE /api/reminders/:id` - リマインダー削除
- `GET /api/reminders/meta/*` - メタデータ取得（カテゴリ・タグ・統計）
- `POST /api/reminders/test/:method` - 通知テスト（webhook/email）

### クイックテスト

サーバー起動確認:
```bash
curl -u admin:your-secure-password http://localhost:3000/health
```

**詳細な仕様、リクエスト・レスポンス例、パラメータ説明は [Swagger UI](http://localhost:3000/api-docs) で確認してください。**

## エラーレスポンス

一般的なHTTPステータスコードとエラーレスポンスについては、[Swagger UI](http://localhost:3000/api-docs) で詳細を確認してください。

### 主要エラーパターン
- **400 Bad Request**: バリデーションエラー、無効なデータ形式
- **404 Not Found**: リソースが存在しない
- **409 Conflict**: データの重複（メールアドレス、URL等）
- **500 Internal Server Error**: サーバー内部エラー

## プロジェクト構造

```
totos_app/
├── src/
│   ├── config/
│   │   └── swagger.js              # Swagger UI設定
│   ├── database/
│   │   ├── bookmarkStorage.js      # ブックマークデータ永続化クラス
│   │   ├── todoStorage.js          # TODOデータ永続化クラス
│   │   └── reminderStorage.js      # リマインダーデータ永続化クラス
│   ├── routes/
│   │   ├── bookmarks.js            # ブックマーク関連ルーター
│   │   ├── todos.js                # TODO関連ルーター
│   │   └── reminders.js            # リマインダー関連ルーター
│   ├── services/
│   │   └── notificationService.js  # 通知サービス（Webhook・Email）
│   ├── utils/
│   │   ├── dateUtils.js            # 日付フォーマット・パースユーティリティ
│   │   └── urlUtils.js             # URL関連ユーティリティ
│   ├── initData.js                 # 初期データ作成
│   ├── createApp.js                # Express アプリケーション設定
│   └── server.js                   # メインサーバーファイル
├── data/
│   ├── bookmarks.json              # ブックマークデータファイル
│   ├── todos.json                  # TODOデータファイル
│   └── reminders.json              # リマインダーデータファイル
├── tests/
│   ├── helpers/                    # テストユーティリティ
│   ├── reminders.test.js           # リマインダー単体テスト
│   ├── reminders.e2e.test.js       # リマインダーE2Eテスト
│   └── *.test.js                   # その他のテストファイル
├── .env                            # 環境変数（要作成）
├── .env.example                    # 環境変数テンプレート
├── package.json                    # プロジェクト設定
└── README.md                       # このファイル
```

### TODO管理API

TODO管理APIの詳細仕様は [Swagger UI](http://localhost:3000/api-docs) で確認してください。

#### 主要機能
- **CRUD操作**: 作成・読み取り・更新・削除
- **フィルタリング**: 完了状態、優先度、カテゴリ、タグによる絞り込み
- **検索機能**: タイトル、説明、タグでの検索
- **期限管理**: 期限日設定、期限切れ検知
- **統計情報**: 進捗率、優先度別統計等

#### エンドポイント概要
- `GET /api/todos` - TODO一覧取得（フィルタ・検索対応）
- `POST /api/todos` - 新規TODO作成
- `GET /api/todos/:id` - 特定TODO取得
- `PUT /api/todos/:id` - TODO更新
- `DELETE /api/todos/:id` - TODO削除
- `PATCH /api/todos/:id/toggle` - 完了状態切り替え
- `GET /api/todos/meta/*` - メタデータ・統計情報

### リマインダー管理API

リマインダー管理APIの詳細仕様は [Swagger UI](http://localhost:3000/api-docs) で確認してください。

#### 主要機能
- **CRUD操作**: 作成・読み取り・更新・削除
- **スケジューリング**: node-scheduleによる自動通知
- **通知方法**: Webhook（HTTP POST）・Email（SMTP）
- **繰り返し設定**: 日次・週次・月次・年次
- **日本語日付形式**: "2025/8/15 18:00" 形式での入力・出力
- **フィルタリング**: 状態、通知方法、カテゴリによる絞り込み
- **統計情報**: 通知済み・未通知の件数等

#### Webhook通知の拡張機能
Webhook通知では、JSONペイロードに加えて**クエリパラメータ**として `title` と `message` が自動付与されます：

- **title**: リマインダーのタイトル（常に付与）
- **message**: メッセージ内容（空でない場合のみ付与）
- **文字エンコード**: 日本語や特殊文字は自動的にURLエンコード

**Webhook URL例:**
```
# タイトルとメッセージ両方がある場合
https://example.com/webhook?title=会議の準備&message=明日の会議の資料を確認してください

# タイトルのみの場合（メッセージが空）
https://example.com/webhook?title=健康診断の予約
```

これにより、Webhookを受信する側でリクエストボディを解析することなく、URLから直接キー情報を取得できます。

#### 日本語日付形式対応
リマインダーAPIは使いやすい日本語日付形式をサポートしています：
- **入力形式**: "2025/8/15 18:00" （年/月/日 時:分）
- **出力形式**: APIレスポンスは常に日本語形式で返却
- **後方互換性**: ISO 8601形式も引き続き受け付け
- **自動判定**: 入力形式を自動で判定・パース

```json
// 日本語形式でのAPI使用例
{
  "title": "会議の準備",
  "message": "明日の会議資料を確認してください",
  "notificationDateTime": "2025/8/15 18:00",
  "notificationMethod": "webhook"
}
```

#### エンドポイント概要
- `GET /api/reminders` - リマインダー一覧取得（フィルタ・検索対応）
- `POST /api/reminders` - 新規リマインダー作成
- `GET /api/reminders/:id` - 特定リマインダー取得
- `PUT /api/reminders/:id` - リマインダー更新
- `DELETE /api/reminders/:id` - リマインダー削除
- `GET /api/reminders/meta/*` - メタデータ・統計情報
- `POST /api/reminders/test/:method` - 通知テスト（webhook/email）

## 開発

### 初期データの生成
```bash
npm run init-data
```

### データファイルの確認
```bash
cat data/bookmarks.json
cat data/todos.json
cat data/reminders.json
```

### リマインダー通知テスト
```bash
# Webhook通知テスト
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"テスト通知","message":"Webhook通知のテストです"}' \
  -X POST http://localhost:3000/api/reminders/test/webhook

# Email通知テスト
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"テスト通知","message":"Email通知のテストです"}' \
  -X POST http://localhost:3000/api/reminders/test/email
```

**Webhook通知テスト時のURL例:**
```
# テスト通知実行時、Webhookは以下のようなURLで送信されます
https://your-webhook-url?title=テスト通知&message=Webhook通知のテストです
```

## セキュリティ機能

- **Helmet**: セキュリティヘッダーの自動設定
- **CORS**: クロスオリジンリクエストの制御
- **入力検証**: 必須フィールドとメールアドレス重複チェック
- **環境変数**: 設定情報の環境変数管理

## 技術スタック

- **Node.js**: JavaScript実行環境
- **Express.js**: Webアプリケーションフレームワーク
- **helmet**: セキュリティミドルウェア
- **cors**: CORS設定
- **dotenv**: 環境変数管理
- **swagger-jsdoc**: JSDocからOpenAPI仕様書生成
- **swagger-ui-express**: Swagger UIの提供
- **node-schedule**: スケジューリング（リマインダー機能）
- **nodemailer**: メール送信（SMTP）
- **axios**: HTTP クライアント（Webhook通知）

## アクセス情報

サーバー起動後、以下のURLにアクセスできます：

- **サーバー**: http://localhost:3000
- **ヘルスチェック**: http://localhost:3000/health
- **API仕様書**: http://localhost:3000/api-docs
- **APIエンドポイント**: http://localhost:3000/api/*

## 使用技術

- **Express.js** - Webフレームワーク
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - セキュリティヘッダー
- **dotenv** - 環境変数管理
- **nodemon** - 開発時のホットリロード

## 開発

サーバーは `http://localhost:3000` で起動します。

ヘルスチェック: http://localhost:3000/health
