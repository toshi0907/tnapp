/**
 * URLからページタイトルを取得する
 * @param {string} url - 取得対象のURL
 * @param {number} timeout - タイムアウト時間（ミリ秒）
 * @returns {Promise<string|null>} ページタイトル、取得できない場合はnull
 */
async function fetchPageTitle(url, timeout = 5000) {
  try {
    // URLの形式チェック
    new URL(url);
    
    // AbortControllerでタイムアウト制御
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // HTMLを取得（Node.js 18+の内蔵fetch使用）
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TNApp-BookmarkBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal,
      redirect: 'follow' // リダイレクトを追跡
    });
    
    clearTimeout(timeoutId);
    
    // HTTPステータスチェック
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    // Content-Typeがhtmlかチェック
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      console.warn(`URL ${url} is not HTML content: ${contentType}`);
      return null;
    }
    
    // HTMLコンテンツを取得
    const html = await response.text();
    
    // タイトルタグを抽出
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    if (!titleMatch || !titleMatch[1]) {
      console.warn(`No title tag found in ${url}`);
      return null;
    }
    
    // HTMLエンティティをデコードし、余分な空白を削除
    let title = titleMatch[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 空のタイトルの場合
    if (!title) {
      console.warn(`Empty title found in ${url}`);
      return null;
    }
    
    // タイトルの長さ制限（255文字）
    if (title.length > 255) {
      title = title.substring(0, 252) + '...';
    }
    
    return title;
    
  } catch (error) {
    // AbortErrorは正常なタイムアウト
    if (error.name === 'AbortError') {
      console.warn(`Timeout fetching title from ${url}`);
    } else {
      console.warn(`Error fetching title from ${url}:`, error.message);
    }
    return null;
  }
}

module.exports = {
  fetchPageTitle
};