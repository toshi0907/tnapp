/**
 * テスト環境のセットアップ
 */

// テスト環境変数の設定
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // テスト用ポート
process.env.BASIC_AUTH_ENABLED = 'false'; // テストでは認証を無効化

// テストタイムアウトの設定
jest.setTimeout(10000);

// コンソール出力を抑制（必要に応じて）
// global.console = {
//   ...console,
//   log: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
