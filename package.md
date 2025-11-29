# パッケージ一覧と用途

TN API Serverで使用しているNode.jsパッケージの機能と用途をまとめたドキュメントです。

## 本番環境依存パッケージ (dependencies)

### Webフレームワーク・ミドルウェア

#### express (^4.18.2)
- **機能**: Node.js用の高速でミニマルなWebアプリケーションフレームワーク
- **用途**: 
  - RESTful APIエンドポイントの定義
  - ルーティング処理
  - ミドルウェア管理
  - HTTPリクエスト/レスポンスのハンドリング
- **使用箇所**: `src/createApp.js`, `src/server.js`, 全ルーターファイル

#### cors (^2.8.5)
- **機能**: Cross-Origin Resource Sharing (CORS) 対応ミドルウェア
- **用途**:
  - クロスオリジンリクエストの許可
  - ブラウザからのAPIアクセスを可能にする
  - セキュリティポリシーの管理
- **使用箇所**: `src/createApp.js`

#### helmet (^7.0.0)
- **機能**: HTTPセキュリティヘッダーを設定するミドルウェア
- **用途**:
  - XSS攻撃対策
  - クリックジャッキング対策
  - MIME type sniffing対策
  - その他のセキュリティベストプラクティスの適用
- **使用箇所**: `src/createApp.js`

### API仕様書・ドキュメント

#### swagger-jsdoc (^6.2.8)
- **機能**: JSDocコメントからOpenAPI (Swagger) 仕様を自動生成
- **用途**:
  - コード内のJSDocコメントをパースしてAPI仕様書を生成
  - OpenAPI 3.0形式のJSON/YAMLスキーマ出力
  - APIエンドポイントの自動ドキュメント化
- **使用箇所**: `src/config/swagger.js`

#### swagger-ui-express (^5.0.1)
- **機能**: Swagger UIをExpressアプリケーションに統合
- **用途**:
  - インタラクティブなAPI仕様書UIの提供
  - ブラウザからのAPIテスト実行機能
  - `/api-docs` エンドポイントでのドキュメント公開
- **使用箇所**: `src/config/swagger.js`, `src/createApp.js`

### 通知・スケジューリング

#### node-schedule (^2.1.1)
- **機能**: cron形式のジョブスケジューリング
- **用途**:
  - リマインダーの時刻指定実行
  - 定期的な通知の自動送信
  - スケジュールされたタスクの管理
- **使用箇所**: `src/services/notificationService.js`

#### nodemailer (^6.9.7)
- **機能**: Node.js用のメール送信ライブラリ
- **用途**:
  - SMTP経由でのメール送信
  - リマインダー通知のメール配信
  - Gmail等の外部メールサービスとの連携
- **使用箇所**: `src/services/notificationService.js`

### HTTP通信

#### axios (^1.6.0)
- **機能**: Promise ベースのHTTPクライアント
- **用途**:
  - Webhook URLへのPOSTリクエスト送信
  - リマインダー通知のWebhook配信
  - 外部APIとの通信
- **使用箇所**: `src/services/notificationService.js`

#### node-fetch (^3.3.2)
- **機能**: Node.js用のfetch API実装（ブラウザ互換）
- **用途**:
  - WebページからHTMLコンテンツの取得
  - ブックマーク作成時のページタイトル自動取得
  - Node.js 18未満の環境での互換性確保
- **使用箇所**: `src/utils/urlUtils.js`
- **備考**: Node.js 18+では内蔵のfetch APIを使用可能だが、互換性のため明示的に依存

### 環境設定

#### dotenv (^16.3.1)
- **機能**: `.env`ファイルから環境変数を読み込む
- **用途**:
  - 環境ごとの設定管理（開発/本番）
  - 機密情報（APIキー、パスワード等）の外部化
  - ポート番号、SMTP設定等の管理
- **使用箇所**: `src/server.js`, `src/createApp.js`, `src/config/swagger.js`, `src/services/notificationService.js`

## 開発環境依存パッケージ (devDependencies)

### テスティングフレームワーク

#### jest (^29.7.0)
- **機能**: JavaScript用のテスティングフレームワーク
- **用途**:
  - 単体テスト（Unit Test）の実行
  - E2Eテスト（End-to-End Test）の実行
  - テストカバレッジレポート生成
  - モック機能によるデータベース・外部API等の分離テスト
- **使用箇所**: `tests/` ディレクトリ全体
- **コマンド**: `npm test`, `npm run test:watch`

#### supertest (^6.3.4)
- **機能**: HTTPアサーションライブラリ（Expressアプリのテスト用）
- **用途**:
  - ExpressアプリケーションへのHTTPリクエストテスト
  - APIエンドポイントの統合テスト
  - レスポンスステータス・ボディの検証
- **使用箇所**: `tests/*.e2e.test.js`, `tests/*.test.js`

### 開発ツール

#### nodemon (^3.0.1)
- **機能**: ファイル変更を監視して自動的にNode.jsアプリを再起動
- **用途**:
  - 開発時のホットリロード
  - コード変更の即座反映
  - 開発効率の向上
- **使用箇所**: 開発サーバー起動時
- **コマンド**: `npm run dev`

## Node.js組み込みモジュール

以下は`package.json`に記載されていませんが、プロジェクト内で使用されているNode.js標準モジュールです。

#### fs (File System)
- **機能**: ファイルシステム操作
- **用途**:
  - JSONファイルの読み書き（データ永続化）
  - ディレクトリの作成・確認
  - `fs.promises`でPromiseベースの非同期操作
- **使用箇所**: `src/database/bookmarkStorage.js`, `src/database/reminderStorage.js`

#### path
- **機能**: ファイルパス操作
- **用途**:
  - クロスプラットフォーム対応のパス結合
  - ディレクトリ名・ファイル名の取得
  - 絶対パスの構築
- **使用箇所**: `src/createApp.js`, `src/database/*.js`

## パッケージの依存関係マップ

```
アプリケーション層
├── express          → Webフレームワーク
│   ├── cors         → CORS対応
│   ├── helmet       → セキュリティ
│   └── swagger-ui-express → API仕様書UI
│
├── swagger-jsdoc    → API仕様書生成
│
├── dotenv           → 環境変数管理
│
├── 通知機能
│   ├── node-schedule → スケジューリング
│   ├── nodemailer   → メール送信
│   └── axios        → Webhook送信
│
├── ユーティリティ
│   └── node-fetch   → HTTP取得（ページタイトル）
│
└── テスト（開発環境）
    ├── jest         → テストフレームワーク
    ├── supertest    → HTTP テスト
    └── nodemon      → 開発時自動再起動
```

## バージョン管理ポリシー

### セマンティックバージョニング記法
- `^x.y.z`: マイナーバージョンとパッチバージョンの更新を許可
  - 例: `^4.18.2` → `4.18.x`, `4.19.x`, `4.20.x`等が許可される
  - メジャーバージョン（4）は固定

### 更新時の注意
- **express, jest, nodemon**: 主要フレームワークのため、更新時は十分なテストが必要
- **swagger-jsdoc, swagger-ui-express**: API仕様の互換性確認が必要
- **nodemailer**: SMTP設定の互換性確認が必要

## セキュリティ監査

定期的なセキュリティチェックコマンド:
```bash
# 脆弱性チェック
npm audit

# 自動修正（パッチバージョンのみ）
npm audit fix

# 強制修正（メジャーバージョンを含む）
npm audit fix --force  # 注意: 破壊的変更の可能性あり
```

## パッケージ追加ガイドライン

新しいパッケージを追加する際の基準:

### 追加前チェックリスト
1. ✅ 必要性の確認（標準機能や既存パッケージで代替不可か）
2. ✅ メンテナンス状況（最終更新日、週間ダウンロード数）
3. ✅ セキュリティ（既知の脆弱性がないか）
4. ✅ ライセンス確認（MIT, Apache等のオープンソースライセンス）
5. ✅ バンドルサイズ（アプリケーションサイズへの影響）

### インストールコマンド
```bash
# 本番環境依存
npm install <package-name>

# 開発環境のみ
npm install --save-dev <package-name>
```

## トラブルシューティング

### パッケージインストールエラー
```bash
# node_modules と package-lock.json を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### 互換性エラー
```bash
# Node.jsバージョンの確認
node -v  # v18.x 以上推奨

# npmバージョンの確認
npm -v   # v9.x 以上推奨
```

---

**最終更新**: 2025年11月29日  
**Node.js要件**: v18.0.0 以上  
**npm要件**: v9.0.0 以上
