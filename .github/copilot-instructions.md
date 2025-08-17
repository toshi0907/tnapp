# TN API Server - GitHub Copilot 指示書

**必ずこの指示書を最初に従い、ここに記載されている情報と一致しない予期しない情報に遭遇した場合のみ、検索やbashコマンドにフォールバックしてください。**

## 効果的な作業方法

### リポジトリのブートストラップとビルド
- `npm install` -- 45-50秒かかります。絶対にキャンセルしないでください。タイムアウトを120秒以上に設定してください。
- `cp .env.example .env` -- 環境設定をコピー
- `mkdir -p data` -- JSON保存用のdataディレクトリを作成
- `npm run init-data` -- サンプルデータを初期化、0.2秒かかります
- `npm test` -- 全テストを実行、2秒かかります。絶対にキャンセルしないでください。タイムアウトを30秒以上に設定してください。

### 開発コマンド
- `npm run dev` -- nodemonで開発サーバーを開始（ホットリロード）
- `npm start` -- 本番サーバーを開始
- `npm run init-data` -- 必要に応じてサンプルデータを再初期化
- `npm test` -- 全テストを実行（32個のテストがパスするはずです）
- `npm run test:watch` -- テストをウォッチモードで実行

### 環境設定
- 初回実行前に `.env.example` を `.env` にコピー
- デフォルトのBasic認証: `admin:your-secure-password`
- デフォルトポート: `3000`
- 認証を無効にするには `BASIC_AUTH_ENABLED=false` を設定（開発時のみ）

## 検証

### 変更後は必ず以下の検証手順を実行してください：
1. **ビルド検証**: `npm install`（依存関係が変更された場合）
2. **テスト検証**: `npm test` -- 32個のテストが全てパスする必要があります
3. **サーバー検証**: `npm run dev`でサーバーを起動し、起動メッセージを確認
4. **ヘルスチェック**: `curl -u admin:your-secure-password http://localhost:3000/health`
5. **API検証**: 少なくとも1つのCRUD操作をテスト（以下のシナリオを参照）

### 手動検証シナリオ
**重要**: 変更後は実際の機能を必ずテストしてください。サーバーの起動と停止だけでは不十分です。

#### 完全なブックマークワークフローテスト
```bash
# 1. サーバー起動
npm run dev

# 2. ヘルスチェック
curl -u admin:your-secure-password http://localhost:3000/health

# 3. ブックマーク作成
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Bookmark","url":"https://test-unique.example.com","description":"Test","tags":["test"],"category":"testing"}' \
  -X POST http://localhost:3000/api/bookmarks

# 4. ブックマーク一覧
curl -u admin:your-secure-password http://localhost:3000/api/bookmarks

# 5. ブックマーク更新（作成レスポンスのIDを使用）
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Test","description":"Updated description"}' \
  -X PUT http://localhost:3000/api/bookmarks/{BOOKMARK_ID}

# 6. ブックマーク削除
curl -u admin:your-secure-password -X DELETE http://localhost:3000/api/bookmarks/{BOOKMARK_ID}
```

#### TODOワークフローテスト
```bash
# todo作成
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"title":"Test TODO","description":"Test description","priority":"high","category":"test"}' \
  -X POST http://localhost:3000/api/todos

# todo一覧
curl -u admin:your-secure-password http://localhost:3000/api/todos

# 完了としてマーク（レスポンスのIDを使用）
curl -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{"completed":true}' \
  -X PUT http://localhost:3000/api/todos/{TODO_ID}
```

### Swagger UI検証
- http://localhost:3000/api-docs にアクセス（認証不要）
- インタラクティブAPIドキュメントが正しく読み込まれることを確認
- Swagger UIから直接APIエンドポイントをテスト

## 実行時間の期待値

**重要**: ビルドやテストを絶対にキャンセルしないでください。適切なタイムアウトを設定してください。

- **依存関係**: `npm install` は45-50秒かかります。タイムアウトを120秒以上に設定してください。
- **テスト**: `npm test` は2秒かかります。安全のためタイムアウトを30秒以上に設定してください。
- **データ初期化**: `npm run init-data` は0.2秒かかります。タイムアウトを30秒以上に設定してください。
- **サーバー起動**: `npm run dev` と `npm start` は即座に起動します（3秒以内）

## プロジェクト構造

### リポジトリルート
```
tnapp/
├── .env.example           # 環境変数テンプレート
├── .gitignore             # Git除外ルール
├── README.md              # プロジェクトドキュメント
├── copilot-instructions.md # 既存のプロジェクト固有の指示書
├── package.json           # 依存関係とスクリプト
├── package-lock.json      # ロックファイル
├── tnapp.code-workspace   # VS Codeワークスペース
├── src/                   # アプリケーションソースコード
├── tests/                 # テストファイル
├── public/                # 静的Webファイル
└── data/                  # JSONデータファイル（init-data後に作成）
```

### ソースコード構造
```
src/
├── config/
│   └── swagger.js         # Swagger UI設定
├── database/
│   ├── bookmarkStorage.js # ブックマークデータ永続化
│   └── todoStorage.js     # TODOデータ永続化
├── routes/
│   ├── bookmarks.js       # ブックマークAPIルート
│   └── todos.js           # TODO APIルート
├── createApp.js           # Expressアプリファクトリー
├── initData.js            # サンプルデータ初期化
└── server.js              # メインサーバーエントリーポイント
```

### 主要APIエンドポイント
- `GET /health` -- データベース統計付きヘルスチェック
- `GET /api-docs` -- Swagger UIドキュメント（認証不要）
- `GET /api/bookmarks` -- 全ブックマーク一覧
- `POST /api/bookmarks` -- ブックマーク作成
- `GET /api/bookmarks/:id` -- 特定ブックマーク取得
- `PUT /api/bookmarks/:id` -- ブックマーク更新
- `DELETE /api/bookmarks/:id` -- ブックマーク削除
- `GET /api/todos` -- 全todo一覧
- `POST /api/todos` -- todo作成
- `PUT /api/todos/:id` -- todo更新
- `DELETE /api/todos/:id` -- todo削除

## 一般的なタスク

### コード変更後
1. **必ず** `npm test` を実行してテストがパスすることを確認
2. **必ず** サーバーを起動して基本機能をテスト
3. **必ず** 変更した特定のAPIエンドポイントをテスト
4. 起動時のコンソールでエラーメッセージがないかチェック

### APIルート変更時
1. `src/routes/` のルートハンドラーを更新
2. ドキュメント用のSwagger JSDocコメントを更新または追加
3. `tests/` のテストを追加または更新
4. `npm test` を実行してテストがパスすることを確認
5. curlでエンドポイントを手動テスト
6. Swagger UIドキュメントが正しく更新されることを確認

### データモデル変更時
1. `src/database/` のストレージクラスを更新
2. 変更されたデータを使用するAPIルートを更新
3. 新機能用のテストを更新または追加
4. 必要に応じて `npm run init-data` でテストデータをリセット
5. 完全なCRUDワークフローを手動テスト

## 技術スタック

- **Node.js**: JavaScript実行環境
- **Express.js**: Webフレームワーク
- **express-basic-auth**: 認証ミドルウェア
- **helmet**: セキュリティヘッダー
- **cors**: クロスオリジンリクエスト処理
- **dotenv**: 環境変数管理
- **swagger-jsdoc**: APIドキュメント生成
- **swagger-ui-express**: インタラクティブAPIドキュメント
- **Jest**: テストフレームワーク
- **supertest**: HTTPテスト
- **nodemon**: 開発時自動リロード

## 認証

- **Basic認証** が全APIエンドポイントを保護（`/api-docs` 除く）
- デフォルト認証情報: `admin:your-secure-password`（`.env` で設定可能）
- `.env` で `BASIC_AUTH_ENABLED=false` を設定して無効化可能
- **絶対に** 実際の認証情報をリポジトリにコミットしない

## データ保存

- `data/` ディレクトリで **JSONファイル保存** を使用
- **bookmarks.json**: ブックマークデータ
- **todos.json**: TODOデータ
- データはサーバー再起動時も永続化
- `npm run init-data` でサンプルデータにリセット

## 開発ガイドライン

### エラーハンドリング
- 全APIエンドポイントは一貫したエラー形式を返す: `{ error: "message" }`
- 適切なHTTPステータスコード（400、404、409、500）を使用
- サーバーエラーをコンソールにログ出力

### テスト
- 単体テストはデータベース操作をモック
- E2Eテストは実際のサーバーとファイルシステムを使用
- テストは `tests/` ディレクトリで `.test.js` 拡張子
- 日本語で説明的なテスト名を使用（既存スタイルに合わせる）
- 変更をコミットする前に全テストがパスする必要がある

### コードスタイル
- コードベースの既存のJavaScriptパターンに従う
- 非同期操作にはasync/awaitを使用
- 包括的なエラーハンドリングを含める
- 全APIエンドポイントにSwagger JSDocコメントを追加

## トラブルシューティング

### テスト失敗
- `data/` ディレクトリが存在することを確認: `mkdir -p data`
- `npm run init-data` で初期データファイルを作成
- ポート3000でサーバーがすでに実行されていないかチェック

### サーバーが起動しない
- `.env` ファイルが存在することを確認: `cp .env.example .env`
- ポート3000が利用可能かチェック
- 全依存関係がインストールされていることを確認: `npm install`

### API が 401 Unauthorized を返す
- `.env` ファイルのBasic認証情報をチェック
- 正しい形式を使用: `curl -u username:password`
- `.env` で `BASIC_AUTH_ENABLED=true` であることを確認

### データが永続化されない
- `data/` ディレクトリが存在し書き込み可能であることを確認
- コンソール出力でエラーをチェック
- JSONファイルが破損していないか確認

## クイックリファレンスコマンド

```bash
# 新規クローンからの完全セットアップ
npm install
cp .env.example .env
mkdir -p data
npm run init-data

# 開発ワークフロー
npm run dev                 # 開発サーバー起動
npm test                    # テスト実行
npm run test:watch          # ウォッチモードテスト

# 本番
npm start                   # 本番サーバー起動

# ヘルスチェック
curl -u admin:your-secure-password http://localhost:3000/health

# API テスト
curl -u admin:your-secure-password http://localhost:3000/api/bookmarks
curl -u admin:your-secure-password http://localhost:3000/api/todos
```