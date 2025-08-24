/**
 * URL関連のユーティリティ関数
 * Webページからタイトル取得、URL検証等を提供
 */

/**
 * URLからページタイトルを取得する
 * ブックマーク作成時の自動タイトル取得に使用
 * @param {string} url - 取得対象のURL
 * @param {number} timeout - タイムアウト時間（ミリ秒、デフォルト: 5000）
 * @returns {Promise<string|null>} ページタイトル、取得できない場合はnull
 */
async function fetchPageTitle(url, timeout = 5000) {
  try {
    // URLの形式チェック - 無効なURLの場合は例外が発生
    new URL(url);
    
    // タイムアウト制御のためのAbortControllerを作成
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // HTMLページを取得（Node.js 18+の内蔵fetch APIを使用）
    const response = await fetch(url, {
      method: 'GET',
      
      // ブラウザらしいHTTPヘッダーを設定（bot検出回避）
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TNApp-BookmarkBot/1.0)',  // 識別可能なユーザーエージェント
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',  // HTML優先のAcceptヘッダー
        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',  // 日本語優先の言語設定
        'Accept-Encoding': 'gzip, deflate',  // 圧縮形式のサポート
        'Connection': 'keep-alive',  // 接続維持
        'Upgrade-Insecure-Requests': '1'  // HTTPS優先リクエスト
      },
      
      signal: controller.signal,  // タイムアウト制御用のシグナル
      redirect: 'follow'  // HTTPリダイレクト（301, 302等）を自動追跡
    });
    
    // タイムアウトタイマーをクリア
    clearTimeout(timeoutId);
    
    // HTTPレスポンスステータスをチェック
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;  // 4xx, 5xxエラーの場合はnullを返す
    }
    
    // レスポンスのContent-Typeを確認（HTMLコンテンツかチェック）
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      console.warn(`URL ${url} is not HTML content: ${contentType}`);
      return null;  // HTML以外（画像、PDF等）の場合はnullを返す
    }
    
    // HTMLコンテンツをテキストとして取得
    const html = await response.text();
    
    // 正規表現でHTMLからtitleタグを抽出
    // フラグ 'i' = 大文字小文字無視, 's' = 改行文字を含む
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    if (!titleMatch || !titleMatch[1]) {
      console.warn(`No title tag found in ${url}`);
      return null;  // titleタグが見つからない場合
    }
    
    // HTMLエンティティのデコードと正規化処理
    let title = titleMatch[1]
      .replace(/&lt;/g, '<')      // &lt; → <
      .replace(/&gt;/g, '>')      // &gt; → >
      .replace(/&amp;/g, '&')     // &amp; → &
      .replace(/&quot;/g, '"')    // &quot; → "
      .replace(/&#39;/g, "'")     // &#39; → '
      .replace(/&nbsp;/g, ' ')    // &nbsp; → 半角スペース
      .replace(/\s+/g, ' ')       // 連続する空白文字を1つのスペースに統一
      .trim();                    // 前後の空白を削除
    
    // 空のタイトルの場合はnullを返す
    if (!title) {
      console.warn(`Empty title found in ${url}`);
      return null;
    }
    
    // タイトルの長さ制限（データベースの制限に合わせて255文字）
    if (title.length > 255) {
      title = title.substring(0, 252) + '...';  // 末尾に省略記号を追加
    }
    
    return title;
    
  } catch (error) {
    // エラーハンドリング
    if (error.name === 'AbortError') {
      // タイムアウトによる中断（正常なケース）
      console.warn(`Timeout fetching title from ${url}`);
    } else {
      // その他のエラー（ネットワークエラー、URL不正等）
      console.warn(`Error fetching title from ${url}:`, error.message);
    }
    return null;  // エラー時はnullを返す
  }
}

// 外部モジュールで使用できるように関数をエクスポート
module.exports = {
  fetchPageTitle  // ページタイトル取得関数
};