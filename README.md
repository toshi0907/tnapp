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
```

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

ブックマークデータは `data/bookmarks.json` ファイルに、TODOデータは `data/todos.json` ファイルに保存されます。サーバー再起動後もデータは保持されます。

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
│   │   └── todoStorage.js          # TODOデータ永続化クラス
│   ├── routes/
│   │   ├── bookmarks.js            # ブックマーク関連ルーター
│   │   └── todos.js                # TODO関連ルーター
│   ├── initData.js                 # 初期データ作成
│   └── server.js                   # メインサーバーファイル
├── data/
│   ├── bookmarks.json              # ブックマークデータファイル
│   └── todos.json                  # TODOデータファイル
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

## 開発

### 初期データの生成
```bash
npm run init-data
```

### データファイルの確認
```bash
cat data/bookmarks.json
cat data/todos.json
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
