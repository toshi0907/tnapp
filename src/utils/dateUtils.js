/**
 * 日付フォーマット関連のユーティリティ
 */

/**
 * 日付文字列を "year/month/day hour:min" 形式にフォーマット
 * @param {Date|string} date - Date オブジェクトまたは ISO 8601 文字列
 * @returns {string} "2025/8/15 18:00" 形式の文字列
 */
function formatDateToYearMonthDayHourMin(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 0ベースなので+1
  const day = d.getDate();
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  
  return `${year}/${month}/${day} ${hour}:${min}`;
}

/**
 * "year/month/day hour:min" 形式の文字列を Date オブジェクトに変換
 * @param {string} dateStr - "2025/8/15 18:00" 形式の文字列
 * @returns {Date} Date オブジェクト
 */
function parseYearMonthDayHourMin(dateStr) {
  // "2025/8/15 18:00" 形式をパース
  const regex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
  const match = dateStr.match(regex);
  
  if (!match) {
    throw new Error('Invalid date format. Expected format: YYYY/M/D HH:MM');
  }
  
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // Dateオブジェクトは0ベース
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10)
  );
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date values');
  }
  
  return date;
}

/**
 * 任意の日付文字列を Date オブジェクトに変換（複数フォーマット対応）
 * @param {string} dateStr - 日付文字列
 * @returns {Date} Date オブジェクト
 */
function parseFlexibleDate(dateStr) {
  if (!dateStr) {
    throw new Error('Date string is required');
  }
  
  // まず "year/month/day hour:min" 形式を試す
  try {
    return parseYearMonthDayHourMin(dateStr);
  } catch (error) {
    // 失敗したら ISO 8601 や他の標準フォーマットを試す
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format. Supported formats: "YYYY/M/D HH:MM" or ISO 8601');
    }
    return date;
  }
}

/**
 * リマインダーオブジェクトの日付フィールドを指定フォーマットに変換
 * @param {Object} reminder - リマインダーオブジェクト
 * @returns {Object} フォーマット済みリマインダーオブジェクト
 */
function formatReminderDates(reminder) {
  const formatted = { ...reminder };
  
  if (formatted.notificationDateTime) {
    formatted.notificationDateTime = formatDateToYearMonthDayHourMin(formatted.notificationDateTime);
  }
  
  if (formatted.lastNotificationDateTime) {
    formatted.lastNotificationDateTime = formatDateToYearMonthDayHourMin(formatted.lastNotificationDateTime);
  }
  
  if (formatted.repeatSettings && formatted.repeatSettings.endDate) {
    formatted.repeatSettings.endDate = formatDateToYearMonthDayHourMin(formatted.repeatSettings.endDate);
  }
  
  return formatted;
}

module.exports = {
  formatDateToYearMonthDayHourMin,
  parseYearMonthDayHourMin,
  parseFlexibleDate,
  formatReminderDates
};