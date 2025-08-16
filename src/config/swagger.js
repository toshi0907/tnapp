const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
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

module.exports = {
  specs,
  swaggerUi,
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
