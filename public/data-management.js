/**
 * データエクスポート/インポートのフロントエンドスクリプト
 * dataフォルダのJSONファイルを個別にダウンロード/アップロード
 */

// エクスポートボタンのクリックハンドラー
document.querySelectorAll('.export-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const filename = btn.dataset.file;
    const messageEl = document.getElementById('data-message');
    
    try {
      messageEl.textContent = `${filename} をダウンロード中...`;
      messageEl.className = 'data-message';

      const response = await fetch(`/api/data/export/${filename}`);
      if (!response.ok) {
        throw new Error('ダウンロードに失敗しました');
      }

      const content = await response.text();
      
      // JSONファイルとしてダウンロード
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // アイテム数を表示
      const data = JSON.parse(content);
      messageEl.textContent = `✅ ${filename} をダウンロードしました（${data.length}件）`;
      messageEl.className = 'data-message success';
    } catch (error) {
      messageEl.textContent = '❌ ' + error.message;
      messageEl.className = 'data-message error';
    }
  });
});

// インポートボタンのクリックハンドラー
document.querySelectorAll('.import-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filename = btn.dataset.file;
    const fileInput = document.querySelector(`input[data-file="${filename}"]`);
    fileInput.click();
  });
});

// ファイル選択時のハンドラー
document.querySelectorAll('input[type="file"]').forEach(input => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filename = input.dataset.file;
    const messageEl = document.getElementById('data-message');
    
    try {
      messageEl.textContent = `${filename} をアップロード中...`;
      messageEl.className = 'data-message';

      const text = await file.text();
      const data = JSON.parse(text);

      // データが配列であることを確認
      if (!Array.isArray(data)) {
        throw new Error('無効なファイル形式: データは配列である必要があります');
      }

      // 確認ダイアログ
      const confirmMsg = `${filename} に ${data.length} 件のデータをインポートします。\n\n既存のデータは上書きされます。続行しますか？`;
      
      if (!confirm(confirmMsg)) {
        messageEl.textContent = 'インポートがキャンセルされました';
        messageEl.className = 'data-message';
        e.target.value = '';
        return;
      }

      const response = await fetch(`/api/data/import/${filename}`, {
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
      messageEl.textContent = `✅ ${result.filename} をインポートしました（${result.count}件）`;
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
});
