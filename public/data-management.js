/**
 * データエクスポート/インポートのフロントエンドスクリプト
 */

// エクスポートボタンのクリックハンドラー
document.getElementById('export-btn').addEventListener('click', async () => {
  const messageEl = document.getElementById('data-message');
  try {
    messageEl.textContent = 'エクスポート中...';
    messageEl.className = 'data-message';

    const response = await fetch('/api/data/export');
    if (!response.ok) {
      throw new Error('エクスポートに失敗しました');
    }

    const data = await response.json();
    
    // JSONファイルとしてダウンロード
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tnapp-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    messageEl.textContent = `✅ エクスポート完了: ブックマーク ${data.bookmarks.length}件、リマインダー ${data.reminders.length}件`;
    messageEl.className = 'data-message success';
  } catch (error) {
    messageEl.textContent = '❌ ' + error.message;
    messageEl.className = 'data-message error';
  }
});

// インポートボタンのクリックハンドラー
document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

// ファイル選択時のハンドラー
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const messageEl = document.getElementById('data-message');
  
  try {
    messageEl.textContent = 'インポート中...';
    messageEl.className = 'data-message';

    const text = await file.text();
    const data = JSON.parse(text);

    // データの基本検証
    if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
      throw new Error('無効なファイル形式: bookmarksが見つかりません');
    }
    if (!data.reminders || !Array.isArray(data.reminders)) {
      throw new Error('無効なファイル形式: remindersが見つかりません');
    }

    // 確認ダイアログ
    const confirmMsg = `以下のデータをインポートします:\n` +
      `・ブックマーク: ${data.bookmarks.length}件\n` +
      `・リマインダー: ${data.reminders.length}件\n\n` +
      `既存のデータは上書きされます。続行しますか？`;
    
    if (!confirm(confirmMsg)) {
      messageEl.textContent = 'インポートがキャンセルされました';
      messageEl.className = 'data-message';
      e.target.value = ''; // ファイル選択をリセット
      return;
    }

    const response = await fetch('/api/data/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'インポートに失敗しました');
    }

    const result = await response.json();
    messageEl.textContent = `✅ インポート完了: ブックマーク ${result.imported.bookmarks}件、リマインダー ${result.imported.reminders}件`;
    messageEl.className = 'data-message success';
  } catch (error) {
    if (error instanceof SyntaxError) {
      messageEl.textContent = '❌ 無効なJSONファイルです';
    } else {
      messageEl.textContent = '❌ ' + error.message;
    }
    messageEl.className = 'data-message error';
  }

  // ファイル選択をリセット
  e.target.value = '';
});
