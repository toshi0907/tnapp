# Totos API Server - GitHub Copilot Instructions

## プロジェクト概要

Node.js + Express.jsで構築されたRESTful APIサーバー。

### 機能
- ブックマーク管理
- TODO管理

## 技術スタック

- **フレームワーク**: Express.js
- **認証**: Basic認証 (express-basic-auth)
- **データ永続化**: JSONファイル
- **API仕様書**: Swagger UI (swagger-jsdoc, swagger-ui-express)
- **セキュリティ**: Helmet, CORS
- **テスト**: Jest, Supertest
- **開発**: nodemon (ホットリロード)

## アーキテクチャパターン

### ディレクトリ構造
```
src/
├── config/          # 設定ファイル (Swagger等)
├── database/        # データアクセス層 (JSONストレージ)
├── routes/          # APIルーター
└── server.js        # メインサーバーファイル

tests/
├── helpers/         # テストユーティリティ
├── *.test.js        # 単体テスト
└── *.e2e.test.js    # E2Eテスト

data/
├── bookmarks.json   # ブックマークデータ
└── todos.json       # TODOデータ
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
- 全エンドポイントにBasic認証必須（Swagger UIとhealthcheckは例外）
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

## 開発環境

### 必須コマンド
- `npm run dev`: 開発サーバー起動（nodemon）
- `npm test`: 全テスト実行
- `npm run test:watch`: テスト監視モード
- `npm start`: 本番サーバー起動

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