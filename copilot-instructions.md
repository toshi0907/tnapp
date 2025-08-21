# TN API Server - GitHub Copilot Instructions

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
- **Swagger UI API仕様書**（インタラクティブなAPI仕様書）

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
│   ├── *.test.js                   # 単体テスト
│   └── *.e2e.test.js              # E2Eテスト
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

## コーディング規約

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

## 開発ガイドライン

### 新機能追加時
1. データモデル定義
2. Storageクラス実装（CRUDメソッド）
3. APIルーター実装
4. Swagger JSDocコメント追加
5. 単体テスト作成（モック使用）
6. E2Eテスト作成（実際のサーバー使用）
7. README更新

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

## 検索・フィルタリング機能

### 実装パターン
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

## パフォーマンス考慮事項

- **メモリ使用量**: 大量データ処理時の効率化
- **ファイルI/O**: 不要な読み書きの最小化
- **検索最適化**: 文字列検索の効率化
- **エラーキャッシュ**: 適切な例外処理

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
```

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

## API エンドポイント

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

### API仕様書
- **Swagger UI**: http://localhost:3000/api-docs で詳細なAPI仕様を確認可能
- **インタラクティブテスト**: ブラウザからAPIテスト実行可能

## 開発環境

### 必須コマンド
- `npm run dev`: 開発サーバー起動（nodemon）
- `npm test`: 全テスト実行
- `npm run test:watch`: テスト監視モード
- `npm start`: 本番サーバー起動
- `npm run init-data`: 初期データの生成

### 環境設定
プロジェクト初回セットアップ時の手順:
1. `npm install` - 依存関係インストール
2. `cp .env.example .env` - 環境変数ファイル作成
3. `.env`ファイルで設定:
   ```bash
   PORT=3000
   NODE_ENV=development
   ```
4. `npm run init-data` - 初期データ生成
5. `npm run dev` - 開発サーバー起動

### 開発フロー
1. 機能要件定義
2. データモデル設計
3. Storage層実装
4. API層実装 + Swagger JSDoc
5. 単体テスト作成
6. E2Eテスト作成
7. テスト実行
8. 動作確認（npm start）
9. ドキュメント更新
10. コミット

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