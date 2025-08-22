const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load environment variables
require('dotenv').config();

// Function to create server configuration based on request context
function createSwaggerServers(req) {
  const servers = [];
  
  if (req) {
    // Dynamic server URL based on the actual request
    const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'http');
    const host = req.get('host') || `localhost:${process.env.PORT || 3000}`;
    const serverUrl = `${protocol}://${host}`;
    
    servers.push({
      url: serverUrl,
      description: 'Current server'
    });
  }
  
  // Fallback servers for different environments
  servers.push({
    url: `http://localhost:${process.env.PORT || 3000}`,
    description: 'Development server (localhost)'
  });
  
  // Production server (if different from current)
  if (process.env.NODE_ENV === 'production') {
    servers.push({
      url: `https://localhost:${process.env.PORT || 3000}`,
      description: 'Production server (HTTPS)'
    });
  }
  
  return servers;
}

const options = {
  definition: {
    openapi: '3.0.0',
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
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Basic認証 (username: admin, password: your-secure-password)'
        }
      },
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
    },
    security: [
      {
        basicAuth: []
      }
    ]
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
