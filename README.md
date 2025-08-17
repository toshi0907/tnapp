# TN API Server

Node.js で構築されたシンプルなAPIサーバです。

## 機能

- Express.js ベースのRESTful API
- **Basic認証**によるアクセス制御
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

`.env.example` を `.env` にコピーして、認証情報を設定してください。

```bash
cp .env.example .env
```

`.env`ファイルの例：
```bash
PORT=3000
NODE_ENV=development

# Basic認証の設定
AUTH_USER=admin
AUTH_PASSWORD=your-secure-password
# Basic認証の有効/無効切り替え (true で有効, false で無効)
BASIC_AUTH_ENABLED=true
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

## 認証

すべてのエンドポイントは**Basic認証**で保護されています（`BASIC_AUTH_ENABLED=true` の場合）。
`BASIC_AUTH_ENABLED=false` にすると Basic 認証は無効化され、全エンドポイントへ認証なしでアクセス可能になります。開発用以外では無効化しないでください。

```bash
# Basic認証を含むリクエスト例
curl -u admin:your-secure-password http://localhost:3000/health
```

## API仕様書

このAPIサーバーには**Swagger UI**によるインタラクティブなAPI仕様書が提供されています。

### Swagger UI
- **URL**: http://localhost:3000/api-docs
- **認証**: 不要（ブラウザから直接アクセス可能）
- **機能**: 
  - 全APIエンドポイントの詳細仕様
  - リクエスト・レスポンスの例
  - インタラクティブなAPIテスト機能（Basic認証設定可能）
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
- **401 Unauthorized**: Basic認証が必要
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
│   ├── createApp.js                # Express アプリケーション作成
│   ├── initData.js                 # 初期データ作成
│   └── server.js                   # メインサーバーファイル
├── tests/                          # テストファイル
│   ├── bookmarks.test.js           # ブックマーク単体テスト
│   ├── bookmarks.e2e.test.js       # ブックマークE2Eテスト
│   ├── basicAuthEnabled.test.js    # Basic認証テスト
│   └── setup.js                    # テスト環境設定
├── deploy/                         # デプロイ関連ファイル
│   ├── deploy.sh                   # デプロイスクリプト
│   └── nginx-tnapp.conf            # nginx設定例
├── data/
│   ├── bookmarks.json              # ブックマークデータファイル
│   └── todos.json                  # TODOデータファイル
├── logs/                           # ログディレクトリ（PM2使用時）
├── .env                            # 環境変数（要作成）
├── .env.example                    # 環境変数テンプレート
├── .env.production                 # 本番環境変数テンプレート
├── ecosystem.config.js             # PM2設定ファイル
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

- **Basic認証**: 全エンドポイントがBasic認証で保護
- **Helmet**: セキュリティヘッダーの自動設定
- **CORS**: クロスオリジンリクエストの制御
- **入力検証**: 必須フィールドとメールアドレス重複チェック
- **環境変数**: 認証情報の環境変数管理

## デプロイ

本番環境での TN API Server のデプロイ方法について説明します。

### PM2 を使用したプロセス管理

#### 1. PM2 のインストール

```bash
# グローバルインストール
npm install -g pm2

# または yarn の場合
yarn global add pm2
```

#### 2. Ecosystem ファイルの作成

`ecosystem.config.js` を作成してプロセス設定を管理します：

```javascript
module.exports = {
  apps: [{
    name: 'tnapp-api',
    script: 'src/server.js',
    instances: 'max', // CPUコア数と同じ数のインスタンス
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      BASIC_AUTH_ENABLED: 'true',
      AUTH_USER: 'admin',
      AUTH_PASSWORD: 'your-secure-production-password'
    },
    // ログ設定
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 自動再起動設定
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
```

#### 3. PM2 でのアプリケーション管理

```bash
# 本番環境でアプリケーション開始
pm2 start ecosystem.config.js --env production

# アプリケーションの状態確認
pm2 status

# ログの確認
pm2 logs tnapp-api

# アプリケーションの再起動
pm2 restart tnapp-api

# アプリケーションの停止
pm2 stop tnapp-api

# PM2 の起動スクリプトを生成（サーバー再起動時の自動起動）
pm2 startup
pm2 save
```

### nginx を使用したリバースプロキシ設定

#### 1. nginx のインストール

```bash
# Ubuntu/Debian の場合
sudo apt update
sudo apt install nginx

# CentOS/RHEL の場合
sudo yum install nginx
# または
sudo dnf install nginx
```

#### 2. nginx 設定ファイル

`/etc/nginx/sites-available/tnapp` を作成：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # ログ設定
    access_log /var/log/nginx/tnapp_access.log;
    error_log /var/log/nginx/tnapp_error.log;

    # PM2で起動したアプリケーションへのプロキシ
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # タイムアウト設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静的ファイルの直接配信（オプション）
    location /public/ {
        proxy_pass http://localhost:3000/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 3. SSL/HTTPS 設定（推奨）

Let's Encrypt を使用した SSL 設定：

```bash
# Certbot のインストール
sudo apt install certbot python3-certbot-nginx

# SSL 証明書の取得
sudo certbot --nginx -d your-domain.com

# 自動更新の設定
sudo crontab -e
# 以下の行を追加:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 4. nginx 設定の有効化

```bash
# 設定ファイルのシンボリックリンク作成
sudo ln -s /etc/nginx/sites-available/tnapp /etc/nginx/sites-enabled/

# 設定ファイルのテスト
sudo nginx -t

# nginx の再起動
sudo systemctl restart nginx

# nginx の自動起動設定
sudo systemctl enable nginx
```

### Basic認証に関する重要な注意点

このアプリケーションは独自の Basic認証を実装していますが、nginx 側でも Basic認証を設定することができます。**両方を同時に有効にすると二重認証となり、ユーザビリティが低下します。**

#### オプション 1: アプリケーション側の Basic認証を使用（推奨）

```bash
# .env ファイル
BASIC_AUTH_ENABLED=true
AUTH_USER=admin
AUTH_PASSWORD=your-secure-password
```

nginx 設定では Basic認証を設定しません。

#### オプション 2: nginx 側で Basic認証を実装

アプリケーション側の Basic認証を無効にし、nginx で認証を行う場合：

```bash
# .env ファイル
BASIC_AUTH_ENABLED=false
```

nginx 設定に認証を追加：

```nginx
server {
    # ... 既存の設定 ...

    # Basic認証の設定
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        # ... プロキシ設定 ...
    }
}
```

htpasswd ファイルの作成：

```bash
# htpasswd ツールのインストール
sudo apt install apache2-utils

# パスワードファイルの作成
sudo htpasswd -c /etc/nginx/.htpasswd admin

# ファイルの権限設定
sudo chmod 644 /etc/nginx/.htpasswd
```

#### 推奨設定

- **開発環境**: アプリケーション側の Basic認証を使用
- **本番環境**: nginx 側での Basic認証 + HTTPS を推奨
  - より高いセキュリティ
  - アプリケーション側の負荷軽減
  - nginx のアクセスログでの認証状況確認が容易

### 環境変数の管理

本番環境では機密情報を適切に管理してください：

```bash
# .env ファイルの権限設定
chmod 600 .env

# ファイルの所有者をアプリケーション実行ユーザーに設定
sudo chown tnapp:tnapp .env
```

### ログとモニタリング

#### PM2 ログ

```bash
# ログディレクトリの作成
mkdir -p logs

# ログローテーション設定
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

#### nginx ログ

```bash
# アクセスログの確認
sudo tail -f /var/log/nginx/tnapp_access.log

# エラーログの確認
sudo tail -f /var/log/nginx/tnapp_error.log
```

### ファイアウォール設定

```bash
# ufw を使用した場合
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# iptables を使用した場合
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### デプロイチェックリスト

- [ ] PM2 ecosystem.config.js の設定
- [ ] 本番用 .env ファイルの作成と権限設定
- [ ] nginx 設定ファイルの作成
- [ ] SSL証明書の設定（Let's Encrypt）
- [ ] Basic認証の設定（nginx または アプリケーション）
- [ ] ファイアウォール設定
- [ ] ログディレクトリの作成
- [ ] PM2 自動起動設定
- [ ] nginx 自動起動設定
- [ ] データディレクトリの権限設定
- [ ] 定期的なバックアップ設定

## 技術スタック

- **Node.js**: JavaScript実行環境
- **Express.js**: Webアプリケーションフレームワーク
- **express-basic-auth**: Basic認証ミドルウェア
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
