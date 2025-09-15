/**
 * Swagger API仕様書設定ファイル
 * OpenAPI 3.0仕様に基づくインタラクティブなAPI仕様書を生成・提供
 * 動的サーバー設定、スキーマ定義、UIカスタマイズを含む
 */

// Swagger関連のライブラリをインポート
const swaggerJsdoc = require('swagger-jsdoc');    // JSDocコメントからOpenAPI仕様を生成
const swaggerUi = require('swagger-ui-express');  // Swagger UIのExpress統合

// 環境変数を読み込み
require('dotenv').config();

/**
 * リクエストコンテキストに基づいて動的サーバー設定を作成する関数
 * 実際のアクセス環境に合わせてSwagger UIで使用可能なサーバーURLを生成
 * @param {Object} req - Expressリクエストオブジェクト（オプショナル）
 * @returns {Array} サーバー設定オブジェクトの配列
 */
function createSwaggerServers(req) {
  // サーバー設定を格納する配列
  const servers = [];
  
  // リクエストオブジェクトが提供されている場合（実際のアクセス時）
  if (req) {
    // 動的サーバーURL を実際のリクエスト情報から構築
    const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'http');  // HTTP/HTTPS判定
    const host = req.get('host') || `localhost:${process.env.PORT || 3000}`;        // ホスト名:ポート
    const serverUrl = `${protocol}://${host}`;
    
    // 現在アクセス中のサーバーを最優先で追加
    servers.push({
      url: serverUrl,
      description: 'Current server'  // 現在のサーバー
    });
  }
  
  // 開発環境用のフォールバックサーバー（localhost）
  servers.push({
    url: `http://localhost:${process.env.PORT || 3000}`,
    description: 'Development server (localhost)'  // 開発サーバー（localhost）
  });
  
  // プロダクション環境の場合はHTTPSサーバーも追加
  if (process.env.NODE_ENV === 'production') {
    servers.push({
      url: `https://localhost:${process.env.PORT || 3000}`,
      description: 'Production server (HTTPS)'  // プロダクションサーバー（HTTPS）
    });
  }
  
  return servers;
}

// Swagger JSDoc の設定オプション
const options = {
  definition: {
    // OpenAPI仕様のバージョン
    openapi: '3.0.0',
    
    // API情報の定義
    info: {
      title: 'Totos API Server',
      version: '1.0.0',
      description: 'Node.js で構築されたシンプルなAPIサーバ。ブックマーク管理とTODO管理機能を提供します。',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: createSwaggerServers(),
    components: {
      // securitySchemes: {
      //   basicAuth: {
      //     type: 'http',
      //     scheme: 'basic',
      //     description: 'Basic認証 (username: admin, password: your-secure-password)'
      //   }
      // },
      schemas: {
        Bookmark: {
          type: 'object',
          required: ['title', 'url'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              description: 'ブックマークID (タイムスタンプベース)',
              example: 1722672000000
            },
            title: {
              type: 'string',
              description: 'ブックマークタイトル',
              example: 'GitHub'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL (ユニーク)',
              example: 'https://github.com'
            },
            description: {
              type: 'string',
              description: 'ブックマークの説明',
              example: 'The world\'s leading software development platform'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'タグ配列',
              example: ['development', 'git', 'coding']
            },
            category: {
              type: 'string',
              description: 'カテゴリ',
              example: 'development'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時'
            }
          }
        },
        Todo: {
          type: 'object',
          required: ['title'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              description: 'TODO ID (タイムスタンプベース)',
              example: 1722672000000
            },
            title: {
              type: 'string',
              description: 'TODOタイトル',
              example: 'APIサーバーの開発を完了する'
            },
            description: {
              type: 'string',
              description: 'TODOの詳細説明',
              example: 'Node.js Express.jsを使用したRESTful APIサーバーの開発'
            },
            completed: {
              type: 'boolean',
              description: '完了状態',
              example: false
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: '優先度',
              example: 'high'
            },
            category: {
              type: 'string',
              description: 'カテゴリ',
              example: 'development'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'タグ配列',
              example: ['api', 'nodejs', 'express']
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: '期限日 (ISO 8601形式)',
              example: '2025-08-10T00:00:00.000Z'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: '完了日時'
            }
          }
        },
        Reminder: {
          type: 'object',
          required: ['title', 'notificationDateTime'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              description: 'リマインダーID (タイムスタンプベース)',
              example: 1722672000000
            },
            title: {
              type: 'string',
              description: 'リマインダータイトル',
              example: '会議の準備'
            },
            message: {
              type: 'string',
              description: 'メッセージ内容',
              example: '明日の会議資料を確認してください'
            },
            notificationDateTime: {
              type: 'string',
              description: '通知日時 (year month day hour min形式)',
              example: '2025/8/15 18:00'
            },
            notificationMethod: {
              type: 'string',
              enum: ['webhook', 'email'],
              description: '通知手段',
              example: 'webhook'
            },
            notificationStatus: {
              type: 'string',
              enum: ['pending', 'sent'],
              description: '通知状態',
              example: 'pending'
            },
            lastNotificationDateTime: {
              type: 'string',
              nullable: true,
              description: '最終通知日時 (year month day hour min形式)',
              example: '2025/8/15 18:00'
            },
            timezone: {
              type: 'string',
              description: 'タイムゾーン',
              example: 'Asia/Tokyo'
            },
            category: {
              type: 'string',
              description: 'カテゴリ',
              example: 'work'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'タグ配列',
              example: ['important', 'meeting']
            },
            repeatSettings: {
              type: 'object',
              nullable: true,
              properties: {
                interval: {
                  type: 'string',
                  enum: ['daily', 'weekly', 'monthly', 'yearly'],
                  description: '繰り返し間隔'
                },
                endDate: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: '繰り返し終了日'
                },
                maxOccurrences: {
                  type: 'integer',
                  nullable: true,
                  description: '最大繰り返し回数'
                },
                currentOccurrence: {
                  type: 'integer',
                  description: '現在の繰り返し回数'
                }
              },
              description: '繰り返し設定'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時'
            }
          }
        },
        WeatherLocation: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              description: '位置情報ID (タイムスタンプベース)',
              example: 1722672000000
            },
            latitude: {
              type: 'number',
              minimum: -90,
              maximum: 90,
              description: '緯度',
              example: 35.6762
            },
            longitude: {
              type: 'number',
              minimum: -180,
              maximum: 180,
              description: '経度',
              example: 139.6503
            },
            name: {
              type: 'string',
              description: '位置名',
              example: '東京駅'
            },
            description: {
              type: 'string',
              description: '位置の説明',
              example: '日本の首都の中心地'
            },
            active: {
              type: 'boolean',
              description: '天気データ取得を有効にするか',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時'
            }
          }
        },
        WeatherData: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              description: '天気データID (タイムスタンプベース)',
              example: 1722672000000
            },
            locationId: {
              type: 'integer',
              description: '位置情報ID',
              example: 1722672000000
            },
            apiSource: {
              type: 'string',
              enum: ['weatherapi', 'yahoo'],
              description: '天気APIソース',
              example: 'weatherapi'
            },
            data: {
              type: 'object',
              nullable: true,
              description: 'APIレスポンスデータ',
              example: {
                "current": {
                  "temperature_2m": 25.4,
                  "relative_humidity_2m": 65,
                  "weather_code": 0
                }
              }
            },
            error: {
              type: 'string',
              nullable: true,
              description: 'エラーメッセージ（取得失敗時）',
              example: null
            },
            success: {
              type: 'boolean',
              description: 'データ取得成功フラグ',
              example: true
            },
            fetchedAt: {
              type: 'string',
              format: 'date-time',
              description: 'データ取得日時'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'エラーメッセージ',
              example: 'Resource not found'
            },
            message: {
              type: 'string',
              description: '詳細メッセージ',
              example: 'The requested resource was not found'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/server.js'], // JSDocコメントを含むファイル
};

const specs = swaggerJsdoc(options);

// Function to create Swagger setup with dynamic servers
function createSwaggerSetup(req) {
  const dynamicSpecs = {
    ...specs,
    servers: createSwaggerServers(req)
  };
  return dynamicSpecs;
}

module.exports = {
  specs,
  swaggerUi,
  createSwaggerSetup,
  swaggerUiOptions: {
    customSiteTitle: 'Totos API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b4151; }
      .swagger-ui .scheme-container { background: #f7f7f7; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true
    }
  }
};
