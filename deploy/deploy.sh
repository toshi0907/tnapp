#!/bin/bash

# TN API Server デプロイスクリプト
# 使用方法: ./deploy/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="tnapp-api"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 TN API Server デプロイを開始します..."
echo "📁 プロジェクトディレクトリ: $PROJECT_DIR"
echo "🏷️  環境: $ENVIRONMENT"

# 環境変数の確認
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ .env ファイルが見つかりません"
    echo "💡 .env.example をコピーして .env を作成してください:"
    echo "   cp .env.example .env"
    exit 1
fi

# 依存関係のインストール
echo "📦 依存関係をインストール中..."
cd "$PROJECT_DIR"
npm ci --production

# データディレクトリの作成
echo "📂 データディレクトリを確認中..."
mkdir -p data logs

# データファイルの初期化（初回デプロイ時のみ）
if [ ! -f "data/bookmarks.json" ] || [ ! -f "data/todos.json" ]; then
    echo "🔄 初期データを作成中..."
    npm run init-data
fi

# ファイル権限の設定
echo "🔐 ファイル権限を設定中..."
chmod 600 .env 2>/dev/null || true
chmod -R 755 data logs

# PM2でアプリケーションを起動/再起動
echo "🔄 PM2でアプリケーションを管理中..."

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo "♻️  アプリケーションを再起動中..."
    pm2 restart "$APP_NAME" --env "$ENVIRONMENT"
else
    echo "🆕 アプリケーションを新規起動中..."
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
fi

# PM2設定の保存
pm2 save

echo "✅ デプロイが完了しました!"
echo ""
echo "📊 アプリケーション状態:"
pm2 status "$APP_NAME"
echo ""
echo "📝 ログの確認:"
echo "   pm2 logs $APP_NAME"
echo ""
echo "🌐 アクセス情報:"
echo "   ヘルスチェック: curl http://localhost:3000/health"
echo "   API仕様書: http://localhost:3000/api-docs"