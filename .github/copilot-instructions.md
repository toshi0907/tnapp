# TN API Server - GitHub Copilot 指示書

**必ずこの指示書を最初に従い、ここに記載されている情報と一致しない予期しない情報に遭遇した場合のみ、検索やbashコマンドにフォールバックしてください。**

## プロジェクト概要

Node.js + Express.jsで構築されたシンプルなRESTful APIサーバー。

### 機能
- Express.js ベースのRESTful API
- **JSONファイル永続化**によるデータ保存
- CORS サポート
- セキュリティヘッダー（Helmet）
- 環境変数管理（dotenv）
- ヘルスチェックエンドポイント
- **ブックマーク管理API**（CRUD操作、検索、カテゴリ・タグ機能対応）
- **TODO管理API**（CRUD操作、優先度・カテゴリ・タグ機能対応）
- **リマインダー管理API**（スケジューリング、通知、日本語日付形式対応）
- **Gemini AI API**（プロンプト実行、スケジューリング機能）
- **Swagger UI API仕様書**（インタラクティブなAPI仕様書）

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
│   ├── todoStorage.js     # TODOデータ永続化
│   ├── reminderStorage.js # リマインダーデータ永続化
│   └── geminiStorage.js   # Gemini AIデータ永続化
├── routes/
│   ├── bookmarks.js       # ブックマークAPIルート
│   ├── todos.js           # TODO APIルート
│   ├── reminders.js       # リマインダーAPIルート
│   └── gemini.js          # Gemini AI APIルート
├── services/
│   └── notificationService.js # 通知サービス（Webhook・Email）
├── utils/
│   ├── dateUtils.js       # 日付フォーマット・パースユーティリティ
│   └── urlUtils.js        # URL関連ユーティリティ
├── createApp.js           # Expressアプリファクトリー
├── initData.js            # サンプルデータ初期化
└── server.js              # メインサーバーエントリーポイント
```

### 主要APIエンドポイント

#### システム
- `GET /health` -- データベース統計付きヘルスチェック
- `GET /api-docs` -- Swagger UIドキュメント（認証不要）
- `GET /config` -- アプリケーション設定（認証不要）

#### ブックマーク管理
- `GET /api/bookmarks` -- 全ブックマーク一覧（検索・フィルタ対応）
- `POST /api/bookmarks` -- ブックマーク作成
- `GET /api/bookmarks/:id` -- 特定ブックマーク取得
- `PUT /api/bookmarks/:id` -- ブックマーク更新
- `DELETE /api/bookmarks/:id` -- ブックマーク削除
- `GET /api/bookmarks/meta/*` -- メタデータ取得（カテゴリ・タグ・統計）

#### TODO管理
- `GET /api/todos` -- 全todo一覧（フィルタ対応）
- `POST /api/todos` -- todo作成
- `GET /api/todos/:id` -- 特定todo取得
- `PUT /api/todos/:id` -- todo更新
- `DELETE /api/todos/:id` -- todo削除
- `PATCH /api/todos/:id/toggle` -- 完了状態切り替え
- `GET /api/todos/meta/*` -- メタデータ取得（カテゴリ・タグ・統計）

#### リマインダー管理
- `GET /api/reminders` -- リマインダー一覧取得（フィルタ・検索対応）
- `POST /api/reminders` -- 新規リマインダー作成
- `GET /api/reminders/:id` -- 特定リマインダー取得
- `PUT /api/reminders/:id` -- リマインダー更新
- `DELETE /api/reminders/:id` -- リマインダー削除
- `GET /api/reminders/meta/*` -- メタデータ取得（カテゴリ・タグ・統計）
- `POST /api/reminders/test/:method` -- 通知テスト（webhook/email）

#### Gemini AI管理
- `GET /api/gemini` -- Gemini実行結果一覧取得（フィルタ・検索対応）
- `POST /api/gemini` -- 新規プロンプト実行
- `GET /api/gemini/:id` -- 特定実行結果取得
- `DELETE /api/gemini/:id` -- 実行結果削除
- `GET /api/gemini/scheduled` -- スケジュール済みプロンプト一覧
- `POST /api/gemini/schedule` -- プロンプトスケジュール作成
- `DELETE /api/gemini/schedule/:id` -- スケジュール削除
- `GET /api/gemini/meta/*` -- メタデータ取得（カテゴリ・タグ・統計）

#### 静的ファイル
- `GET /public/*` -- 静的ファイル（CSS、JS、HTML）
- `GET /public/gemini/` -- Gemini AI Webインターフェース

### API仕様書
- **Swagger UI**: http://localhost:3000/api-docs で詳細なAPI仕様を確認可能
- **インタラクティブテスト**: ブラウザからAPIテスト実行可能

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

- **フレームワーク**: Express.js
- **データ永続化**: JSONファイル
- **API仕様書**: Swagger UI (swagger-jsdoc, swagger-ui-express)
- **セキュリティ**: Helmet, CORS
- **スケジューリング**: node-schedule（リマインダー機能）
- **通知**: nodemailer（Email）, axios（Webhook）
- **日付処理**: カスタム日付ユーティリティ（日本語形式対応）
- **テスト**: Jest, Supertest
- **開発**: nodemon (ホットリロード)
- **AI統合**: Google Gemini API（プロンプト実行、レスポンス管理）

### ライブラリ詳細
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

## アーキテクチャパターン

### ディレクトリ構造
```
tnapp/
├── src/
│   ├── config/
│   │   └── swagger.js              # Swagger UI設定
│   ├── database/
│   │   ├── bookmarkStorage.js      # ブックマークデータ永続化クラス
│   │   ├── todoStorage.js          # TODOデータ永続化クラス
│   │   ├── reminderStorage.js      # リマインダーデータ永続化クラス
│   │   └── geminiStorage.js        # Gemini AIデータ永続化クラス
│   ├── routes/
│   │   ├── bookmarks.js            # ブックマーク関連ルーター
│   │   ├── todos.js                # TODO関連ルーター
│   │   ├── reminders.js            # リマインダー関連ルーター
│   │   └── gemini.js               # Gemini AI関連ルーター
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
│   ├── reminders.json              # リマインダーデータファイル
│   └── gemini.json                 # Gemini AIデータファイル
├── tests/
│   ├── helpers/                    # テストユーティリティ
│   ├── reminders.test.js           # リマインダー単体テスト
│   ├── reminders.e2e.test.js       # リマインダーE2Eテスト
│   ├── gemini.test.js              # Gemini AI単体テスト
│   ├── gemini.e2e.test.js          # Gemini AI E2Eテスト
│   ├── *.test.js                   # 単体テスト
│   └── *.e2e.test.js              # E2Eテスト
├── public/
│   ├── style.css                   # 共通スタイル
│   ├── gemini/                     # Gemini AI用Webインターフェース
│   │   ├── index.html              # メインページ
│   │   └── app.js                  # フロントエンドJavaScript
│   └── ...                         # その他静的ファイル
├── .env                            # 環境変数（要作成）
├── .env.example                    # 環境変数テンプレート
├── package.json                    # プロジェクト設定
└── README.md                       # プロジェクト説明
```

### データアクセスパターン
- 各エンティティごとに専用のStorageクラス
- JSONファイルでの永続化
- CRUD操作の統一インターフェース
- シングルトンパターンでStorageインスタンス管理

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

## コーディング規約

### 共通
- コメントは日本語で記述
- 処理のまとまり毎にコメントによる説明を記述

### JavaScript/Node.js
- **ES6+構文**: async/await, アロー関数、分割代入等を積極使用
- **エラーハンドリング**: try-catch文で適切な例外処理
- **関数名**: キャメルケース (`getBookmarkById`, `createTodo`)
- **定数**: UPPER_SNAKE_CASE (`DATA_FILE`, `PORT`)
- **ファイル名**: キャメルケース (`bookmarkStorage.js`)

### API設計
- **RESTful**: 標準的なHTTPメソッド使用
- **エンドポイント**: `/api/{resource}`形式
- **レスポンス**: 一貫したJSON形式
- **エラー**: 適切なHTTPステータスコードとエラーメッセージ
- **メタデータ**: `/api/{resource}/meta/*`でメタ情報提供

### Swagger JSDoc
- 全エンドポイントに詳細なJSDocコメント必須
- リクエスト/レスポンスのスキーマ定義
- 適切なHTTPステータスコード記載
- 例示データの提供

### テスト
- **テストファイル**: `*.test.js` (単体), `*.e2e.test.js` (E2E)
- **describeブロック**: 機能別にグループ化
- **テストケース名**: 日本語で分かりやすく記述
- **モック**: 外部依存関係は適切にモック化
- **アサーション**: expectを使用した明確な検証

## 重要な制約・ルール

### セキュリティ
- 入力値の適切なバリデーション
- URL形式の検証（new URL()使用）
- Helmetによるセキュリティヘッダー設定

### バリデーション
- 必須フィールドの存在チェック
- URL形式の検証 (`new URL()`で例外キャッチ)
- 重複データのチェック（URL等）

### エラーハンドリング
- 一貫したエラーレスポンス形式: `{ error: string }`
- 適切なHTTPステータスコード使用
- 400: バリデーションエラー
- 404: リソース未発見
- 409: 重複エラー
- 500: サーバーエラー
- ユーザーフレンドリーなエラーメッセージ
- サーバーエラーの適切なログ出力（console.error）

### データ整合性
- ID生成: `Date.now()`使用
- 更新時: `updatedAt`フィールド自動更新
- 削除時: 物理削除（論理削除ではない）
- 部分更新: `undefined`値は既存値を保持

## データ保存

- `data/` ディレクトリで **JSONファイル保存** を使用
- **bookmarks.json**: ブックマークデータ
- **todos.json**: TODOデータ
- **reminders.json**: リマインダーデータ
- **gemini.json**: Gemini AI実行結果データ
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

### 新機能追加時
1. データモデル定義
2. Storageクラス実装（CRUDメソッド）
3. APIルーター実装
4. Swagger JSDocコメント追加
5. 単体テスト作成（モック使用）
6. E2Eテスト作成（実際のサーバー使用）
7. README更新
8. copilot-instruction.mdの更新

### Storageクラス実装パターン
```javascript
class EntityStorage {
  constructor(filename = 'entities.json') {
    this.dataDir = path.join(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, filename);
  }

  async ensureDataFile() { /* ファイル存在確認・作成 */ }
  async readData() { /* データ読み込み */ }
  async writeData(data) { /* データ書き込み */ }
  async getEntities() { /* 全件取得 */ }
  async getEntityById(id) { /* ID指定取得 */ }
  async addEntity(data) { /* 新規作成 */ }
  async updateEntity(id, data) { /* 更新 */ }
  async deleteEntity(id) { /* 削除 */ }
}

module.exports = new EntityStorage();
```

### API エンドポイント実装パターン
```javascript
/**
 * @swagger
 * /api/entities/{id}:
 *   get:
 *     summary: エンティティ取得
 *     tags: [Entities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entity'
 *       404:
 *         description: 未発見
 */
router.get('/:id', async (req, res) => {
  try {
    const entity = await storage.getEntityById(req.params.id);
    
    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found'
      });
    }
    
    res.json(entity);
  } catch (error) {
    console.error('Error getting entity:', error);
    res.status(500).json({
      error: 'Failed to get entity'
    });
  }
});
```

### テストパターン

#### 単体テスト（モック使用）
```javascript
describe('Entities API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたIDのエンティティを取得できる', async () => {
    // Given
    const mockEntity = { id: 1, name: 'Test Entity' };
    storage.getEntityById.mockResolvedValue(mockEntity);
    
    // When
    const response = await request(app)
      .get('/api/entities/1')
      .expect(200);
    
    // Then
    expect(response.body).toEqual(mockEntity);
    expect(storage.getEntityById).toHaveBeenCalledWith('1');
  });
});
```

#### E2Eテスト（実際のサーバー使用）
```javascript
describe('Entities API - E2E Tests', () => {
  let app;
  
  beforeAll(async () => {
    // テスト用アプリケーション作成
    app = express();
    app.use(express.json());
    app.use('/api/entities', entityRouter);
  });

  it('完全なCRUDワークフローが正常に動作する', async () => {
    // Create
    const createResponse = await request(app)
      .post('/api/entities')
      .send(newEntity)
      .expect(201);
    
    const id = createResponse.body.id;
    
    // Read
    await request(app)
      .get(`/api/entities/${id}`)
      .expect(200);
    
    // Update
    await request(app)
      .put(`/api/entities/${id}`)
      .send(updateData)
      .expect(200);
    
    // Delete
    await request(app)
      .delete(`/api/entities/${id}`)
      .expect(204);
  });
});
```

### 検索・フィルタリング機能

#### 実装パターン
```javascript
async searchEntities(filters) {
  const entities = await this.readData();
  
  if (typeof filters === 'string') {
    // 単純文字列検索
    return entities.filter(entity => 
      (entity.title || '').toLowerCase().includes(filters.toLowerCase())
    );
  }
  
  // 複合フィルタ処理
  return entities.filter(entity => {
    let matches = true;
    
    if (filters.search) {
      const query = filters.search.toLowerCase();
      matches = matches && (
        (entity.title || '').toLowerCase().includes(query) ||
        (entity.description || '').toLowerCase().includes(query)
      );
    }
    
    if (filters.category) {
      matches = matches && entity.category === filters.category;
    }
    
    return matches;
  });
}
```

## リマインダー機能開発ガイドライン

### 日本語日付形式対応
リマインダーAPIでは日本語の日付形式 "year/month/day hour:min" をサポート：

```javascript
// dateUtils.js の使用例
const { parseFlexibleDate, formatReminderDates } = require('../utils/dateUtils');

// 入力データの処理（日本語形式とISO形式両方対応）
const parsedDate = parseFlexibleDate("2025/8/15 18:00"); // または "2025-08-15T18:00:00Z"

// 出力データのフォーマット（常に日本語形式）
const formattedReminder = formatReminderDates(reminderData);
```

### スケジューリング機能
node-scheduleを使用した自動通知システム：

```javascript
// 通知スケジュールの設定
const schedule = require('node-schedule');

// 一回限りの通知
const job = schedule.scheduleJob(notificationDate, () => {
  notificationService.sendNotification(reminder);
});

// 繰り返し通知
const rule = new schedule.RecurrenceRule();
rule.hour = 9;  // 毎日9時
const recurringJob = schedule.scheduleJob(rule, () => {
  // 繰り返し処理
});
```

### 通知サービスパターン
複数の通知方法を統一的に扱うパターン：

```javascript
// notificationService.js
class NotificationService {
  async sendNotification(reminder) {
    switch (reminder.notificationMethod) {
      case 'webhook':
        return await this.sendWebhook(reminder);
      case 'email':
        return await this.sendEmail(reminder);
      default:
        throw new Error('Unsupported notification method');
    }
  }

  async sendWebhook(reminder) {
    const response = await axios.post(process.env.WEBHOOK_URL, {
      title: reminder.title,
      message: reminder.message,
      timestamp: new Date().toISOString()
    });
    return response.status === 200;
  }

  async sendEmail(reminder) {
    // nodemailer設定とメール送信
  }
}
```

### 環境変数（リマインダー関連）
`.env` ファイルに以下の設定が必要：

```bash
# Webhook設定
WEBHOOK_URL=https://webhook.site/your-webhook-url

# SMTP設定（Gmail用の推奨設定）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_AUTH_METHOD=PLAIN
SMTP_REQUIRE_TLS=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=notification@example.com

# Gemini AI設定
GEMINI_API_KEY=your-gemini-api-key
```

## パフォーマンス考慮事項

- **メモリ使用量**: 大量データ処理時の効率化
- **ファイルI/O**: 不要な読み書きの最小化
- **検索最適化**: 文字列検索の効率化
- **エラーキャッシュ**: 適切な例外処理

## 推奨しないパターン

### ❌ 避けるべきパターン
```javascript
// 同期処理の使用
const data = fs.readFileSync(filePath);

// エラーハンドリングなし
const entity = await storage.getEntity(id);
res.json(entity);

// 不適切なHTTPステータス
res.status(200).json({ error: 'Not found' });

// バリデーションなし
const newEntity = req.body;
await storage.addEntity(newEntity);
```

### ✅ 推奨パターン
```javascript
// 非同期処理の使用
const data = await fs.readFile(filePath, 'utf-8');

// 適切なエラーハンドリング
try {
  const entity = await storage.getEntity(id);
  if (!entity) {
    return res.status(404).json({ error: 'Entity not found' });
  }
  res.json(entity);
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
}

// 適切なバリデーション
const { title, url } = req.body;
if (!title || !url) {
  return res.status(400).json({ 
    error: 'Title and URL are required' 
  });
}
```

## コミットに関するガイドライン

### 言語
- **日本語**: コミットメッセージは日本語で記述

### コミットの分割

以下の基準に従って、適切な単位でコミット
- **feat**: 新機能追加
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: フォーマット修正（コードの動作に影響しない）
- **refactor**: リファクタリング

### コミット前確認
- テストの実行（全てのテストが通ることを確認）

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