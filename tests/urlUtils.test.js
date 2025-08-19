const { fetchPageTitle } = require('../src/utils/urlUtils');

// fetch のモック（テスト環境では外部ネットワークアクセスが制限される場合がある）
global.fetch = jest.fn();

describe('URL Utils', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('fetchPageTitle', () => {
    it('有効なHTMLからタイトルを抽出できる', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Page Title</title>
        </head>
        <body>
          <h1>Hello World</h1>
        </body>
        </html>
      `;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : null
        },
        text: () => Promise.resolve(mockHtml)
      });
      
      const title = await fetchPageTitle('https://example.com');
      
      expect(title).toBe('Test Page Title');
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('TNApp-BookmarkBot')
          })
        })
      );
    });
    
    it('無効なURLの場合nullを返す', async () => {
      const title = await fetchPageTitle('invalid-url');
      expect(title).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });
    
    it('HTTPエラーの場合nullを返す', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      const title = await fetchPageTitle('https://example.com/404');
      expect(title).toBeNull();
    });
    
    it('HTMLではないコンテンツの場合nullを返す', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'content-type' ? 'application/json' : null
        }
      });
      
      const title = await fetchPageTitle('https://api.example.com/json');
      expect(title).toBeNull();
    });
    
    it('titleタグがない場合nullを返す', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>No Title Tag</h1>
        </body>
        </html>
      `;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : null
        },
        text: () => Promise.resolve(mockHtml)
      });
      
      const title = await fetchPageTitle('https://example.com');
      expect(title).toBeNull();
    });
    
    it('HTMLエンティティが正しくデコードされる', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test &amp; Example &lt;Site&gt;</title>
        </head>
        <body>
        </body>
        </html>
      `;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : null
        },
        text: () => Promise.resolve(mockHtml)
      });
      
      const title = await fetchPageTitle('https://example.com');
      expect(title).toBe('Test & Example <Site>');
    });
    
    it('空白が正規化される', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>   Test   Title   With   Spaces   </title>
        </head>
        <body>
        </body>
        </html>
      `;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : null
        },
        text: () => Promise.resolve(mockHtml)
      });
      
      const title = await fetchPageTitle('https://example.com');
      expect(title).toBe('Test Title With Spaces');
    });
    
    it('長いタイトルが切り詰められる', async () => {
      const longTitle = 'A'.repeat(300);
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${longTitle}</title>
        </head>
        <body>
        </body>
        </html>
      `;
      
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : null
        },
        text: () => Promise.resolve(mockHtml)
      });
      
      const title = await fetchPageTitle('https://example.com');
      expect(title.length).toBeLessThanOrEqual(255);
      expect(title).toMatch(/\.\.\.$/);
    });
    
    it('ネットワークエラーの場合nullを返す', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const title = await fetchPageTitle('https://example.com');
      expect(title).toBeNull();
    });
  });
});