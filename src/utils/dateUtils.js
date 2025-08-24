/**
 * 日付フォーマット関連のユーティリティ
 * リマインダー機能で使用する日本語日付形式 "year/month/day hour:min" と
 * 標準ISO形式との相互変換を提供
 */

/**
 * 日付文字列を "year/month/day hour:min" 形式にフォーマット
 * @param {Date|string} date - Date オブジェクトまたは ISO 8601 文字列
 * @returns {string} "2025/8/15 18:00" 形式の文字列
 */
function formatDateToYearMonthDayHourMin(date) {
  // 入力値をDateオブジェクトに変換
  const d = new Date(date);
  
  // 無効な日付の場合はエラーを投げる
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  
  // 各日付コンポーネントを抽出
  const year = d.getFullYear();          // 年（4桁）
  const month = d.getMonth() + 1;        // 月（1-12）※getMonthは0ベースなので+1
  const day = d.getDate();               // 日（1-31）
  const hour = d.getHours().toString().padStart(2, '0');     // 時（2桁）
  const min = d.getMinutes().toString().padStart(2, '0');    // 分（2桁）
  
  // 日本語日付形式で文字列を構築して返す
  return `${year}/${month}/${day} ${hour}:${min}`;
}

/**
 * "year/month/day hour:min" 形式の文字列を Date オブジェクトに変換
 * @param {string} dateStr - "2025/8/15 18:00" 形式の文字列
 * @returns {Date} Date オブジェクト
 */
function parseYearMonthDayHourMin(dateStr) {
  // 日本語日付形式の正規表現パターン "2025/8/15 18:00"
  const regex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
  const match = dateStr.match(regex);
  
  // パターンにマッチしない場合はエラー
  if (!match) {
    throw new Error('Invalid date format. Expected format: YYYY/M/D HH:MM');
  }
  
  // 正規表現キャプチャグループから各コンポーネントを抽出
  const [, year, month, day, hour, minute] = match;
  
  // Dateオブジェクトを作成（月は0ベースなので-1）
  const date = new Date(
    parseInt(year, 10),        // 年
    parseInt(month, 10) - 1,   // 月（Dateオブジェクトは0ベース）
    parseInt(day, 10),         // 日
    parseInt(hour, 10),        // 時
    parseInt(minute, 10)       // 分
  );
  
  // 作成されたDateオブジェクトが有効かチェック
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date values');
  }
  
  return date;
}

/**
 * 任意の日付文字列を Date オブジェクトに変換（複数フォーマット対応）
 * 日本語形式を優先し、失敗した場合は標準的な日付フォーマットを試行
 * @param {string} dateStr - 日付文字列
 * @returns {Date} Date オブジェクト
 */
function parseFlexibleDate(dateStr) {
  // 空文字列やnullの場合はエラー
  if (!dateStr) {
    throw new Error('Date string is required');
  }
  
  // まず日本語形式 "year/month/day hour:min" の解析を試行
  try {
    return parseYearMonthDayHourMin(dateStr);
  } catch (error) {
    // 日本語形式に失敗した場合は、ISO 8601やその他標準フォーマットを試す
    const date = new Date(dateStr);
    
    // 標準フォーマットでも解析に失敗した場合はエラー
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format. Supported formats: "YYYY/M/D HH:MM" or ISO 8601');
    }
    
    return date;
  }
}

/**
 * リマインダーオブジェクトの日付フィールドを指定フォーマットに変換
 * APIレスポンス用に内部の日付データを日本語形式に統一
 * @param {Object} reminder - リマインダーオブジェクト
 * @returns {Object} フォーマット済みリマインダーオブジェクト
 */
function formatReminderDates(reminder) {
  // 元オブジェクトを変更しないようにシャローコピーを作成
  const formatted = { ...reminder };
  
  // 通知日時が設定されている場合は日本語形式に変換
  if (formatted.notificationDateTime) {
    formatted.notificationDateTime = formatDateToYearMonthDayHourMin(formatted.notificationDateTime);
  }
  
  // 最終通知日時が設定されている場合は日本語形式に変換
  if (formatted.lastNotificationDateTime) {
    formatted.lastNotificationDateTime = formatDateToYearMonthDayHourMin(formatted.lastNotificationDateTime);
  }
  
  // 繰り返し設定の終了日が設定されている場合は日本語形式に変換
  if (formatted.repeatSettings && formatted.repeatSettings.endDate) {
    formatted.repeatSettings.endDate = formatDateToYearMonthDayHourMin(formatted.repeatSettings.endDate);
  }
  
  // フォーマット済みオブジェクトを返す
  return formatted;
}

// 外部モジュールで使用できるように関数群をエクスポート
module.exports = {
  formatDateToYearMonthDayHourMin,  // 日付→日本語形式変換
  parseYearMonthDayHourMin,         // 日本語形式→Date変換
  parseFlexibleDate,                // 柔軟な日付解析
  formatReminderDates               // リマインダー日付フォーマット
};