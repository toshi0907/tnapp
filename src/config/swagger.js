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
      description: 'Node.js で構築されたシンプルなAPIサーバ。ブックマーク管理とリマインダー管理機能を提供します。',
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
            url: {
              type: 'string',
              format: 'uri',
              description: '関連URL（Webhook通知ではクエリパラメータとして送信、Email通知では本文末尾に記載）',
              example: 'https://example.com/meeting-details'
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
