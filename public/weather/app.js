/**
 * 天気情報管理フロントエンドアプリケーション
 * 位置情報の管理と天気データの表示機能を提供
 * APIサーバーとの通信でデータ永続化を行う
 */

// DOMコンテンツの読み込み完了後に実行される非同期関数
document.addEventListener('DOMContentLoaded', async () => {
  // フォーム要素の参照を取得
  const locationForm = document.getElementById('location-form');
  const locationsContainer = document.getElementById('locations-container');
  const weatherContainer = document.getElementById('weather-container');
  const msg = document.getElementById('msg');
  const locationFormSection = document.getElementById('location-form-section');
  const locationFormTitle = document.getElementById('location-form-title');
  
  // 入力フィールドの参照を取得
  const locationNameInput = document.getElementById('location-name');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const descriptionInput = document.getElementById('description');
  const locationIdInput = document.getElementById('location-id');
  
  // ボタン要素の参照を取得
  const addLocationBtn = document.getElementById('add-location-btn');
  const locationSubmitBtn = document.getElementById('location-submit-btn');
  const locationCancelBtn = document.getElementById('location-cancel-btn');
  const refreshLocationsBtn = document.getElementById('refresh-locations-btn');
  const refreshWeatherBtn = document.getElementById('refresh-weather-btn');
  
  // フィルタ要素の参照を取得
  const apiSourceFilter = document.getElementById('api-source-filter');
  
  // API設定とBasic認証情報を動的に取得
  let LOCATIONS_API;   // 位置情報APIベースURL
  let WEATHER_API;     // 天気データAPIベースURL
  let authHeaders;     // 認証ヘッダー
  
  try {
    // サーバー設定を取得
    const configRes = await fetch('/config');
    const config = await configRes.json();
    
    // Basic認証が有効な場合の認証ヘッダー設定
    if (config.authEnabled) {
      // 注意: 実際のアプリケーションでは、認証情報は適切なログインフローで取得すべき
      // デモ目的で .env のデフォルト認証情報を使用
      const username = 'admin';
      const password = 'your-secure-password';
      
      // Base64エンコードでBasic認証文字列を作成
      const credentials = btoa(`${username}:${password}`);
      authHeaders = {
        'Authorization': `Basic ${credentials}`
      };
    } else {
      authHeaders = {};
    }
    
    // 本番環境（リバースプロキシ）では現在のプロトコルとホストを使用
    // 開発環境では設定されたポートを使用
    const currentProtocol = window.location.protocol;
    const currentHost = window.location.hostname;
    const isProduction = currentProtocol === 'https:' || window.location.port === '';
    
    if (isProduction) {
      // 本番環境: リバースプロキシ経由
      LOCATIONS_API = `${currentProtocol}//${window.location.host}/api/weather/locations`;
      WEATHER_API = `${currentProtocol}//${window.location.host}/api/weather`;
    } else {
      // 開発環境: 直接ポート指定
      const currentPort = config.port;
      LOCATIONS_API = `${currentProtocol}//${currentHost}:${currentPort}/api/weather/locations`;
      WEATHER_API = `${currentProtocol}//${currentHost}:${currentPort}/api/weather`;
    }
  } catch (e) {
    // フォールバック: 現在のホストとポートを使用
    console.warn('設定の取得に失敗しました。フォールバック設定を使用します:', e);
    const currentUrl = window.location.origin;
    LOCATIONS_API = `${currentUrl}/api/weather/locations`;
    WEATHER_API = `${currentUrl}/api/weather`;
    authHeaders = {};
  }

  /**
   * メッセージ表示関数
   * @param {string} message - 表示するメッセージ
   * @param {string} type - メッセージタイプ ('success' | 'error' | 'info')
   */
  function showMessage(message, type = 'info') {
    msg.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
      msg.innerHTML = '';
    }, 5000);
  }

  /**
   * 位置情報一覧を取得して表示
   */
  async function loadLocations() {
    try {
      const response = await fetch(LOCATIONS_API, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const locations = await response.json();
      displayLocations(locations);
    } catch (error) {
      console.error('位置情報の取得エラー:', error);
      showMessage('位置情報の取得に失敗しました', 'error');
    }
  }

  /**
   * 位置情報一覧を画面に表示
   * @param {Array} locations - 位置情報配列
   */
  function displayLocations(locations) {
    if (locations.length === 0) {
      locationsContainer.innerHTML = '<p class="no-data">登録された位置情報がありません</p>';
      return;
    }

    const locationsHtml = locations.map(location => `
      <div class="location-card" data-location-id="${location.id}">
        <div class="location-header">
          <h3>${escapeHtml(location.name || '名前未設定')}</h3>
          <div class="location-actions">
            <button class="btn btn-sm btn-primary fetch-weather-btn" data-location-id="${location.id}">
              🌤️ 天気取得
            </button>
            <button class="btn btn-sm btn-secondary edit-location-btn" data-location-id="${location.id}">
              ✏️ 編集
            </button>
            <button class="btn btn-sm btn-danger delete-location-btn" data-location-id="${location.id}">
              🗑️ 削除
            </button>
          </div>
        </div>
        <div class="location-details">
          <p><strong>緯度:</strong> ${location.latitude}</p>
          <p><strong>経度:</strong> ${location.longitude}</p>
          ${location.description ? `<p><strong>説明:</strong> ${escapeHtml(location.description)}</p>` : ''}
          <p><strong>状態:</strong> ${location.active ? '✅ アクティブ' : '⏸️ 無効'}</p>
          <p><strong>作成日:</strong> ${formatDate(location.createdAt)}</p>
        </div>
      </div>
    `).join('');

    locationsContainer.innerHTML = locationsHtml;
    
    // イベントリスナーを追加
    addLocationEventListeners();
  }

  /**
   * 位置情報カードのイベントリスナーを追加
   */
  function addLocationEventListeners() {
    // 天気取得ボタン
    document.querySelectorAll('.fetch-weather-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const locationId = e.target.dataset.locationId;
        await fetchWeatherForLocation(locationId);
      });
    });

    // 編集ボタン
    document.querySelectorAll('.edit-location-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const locationId = e.target.dataset.locationId;
        await editLocation(locationId);
      });
    });

    // 削除ボタン
    document.querySelectorAll('.delete-location-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const locationId = e.target.dataset.locationId;
        await deleteLocation(locationId);
      });
    });
  }

  /**
   * 指定された位置の天気データを手動で取得
   * @param {string} locationId - 位置情報ID
   */
  async function fetchWeatherForLocation(locationId) {
    try {
      showMessage('天気データを取得中...', 'info');
      
      const response = await fetch(`${WEATHER_API}/fetch/${locationId}`, {
        method: 'POST',
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      showMessage('天気データを取得しました', 'success');
      
      // 天気データを更新表示
      await loadWeatherData();
    } catch (error) {
      console.error('天気データ取得エラー:', error);
      showMessage('天気データの取得に失敗しました', 'error');
    }
  }

  /**
   * 位置情報を編集
   * @param {string} locationId - 位置情報ID
   */
  async function editLocation(locationId) {
    try {
      const response = await fetch(`${LOCATIONS_API}/${locationId}`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const location = await response.json();
      
      // フォームに既存の値を設定
      locationIdInput.value = location.id;
      locationNameInput.value = location.name || '';
      latitudeInput.value = location.latitude;
      longitudeInput.value = location.longitude;
      descriptionInput.value = location.description || '';
      
      // フォームを表示
      locationFormTitle.textContent = '位置情報を編集';
      locationSubmitBtn.textContent = '更新';
      locationFormSection.style.display = 'block';
      locationFormSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('位置情報取得エラー:', error);
      showMessage('位置情報の取得に失敗しました', 'error');
    }
  }

  /**
   * 位置情報を削除
   * @param {string} locationId - 位置情報ID
   */
  async function deleteLocation(locationId) {
    if (!confirm('この位置情報を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`${LOCATIONS_API}/${locationId}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      showMessage('位置情報を削除しました', 'success');
      await loadLocations();
      await loadWeatherData();
    } catch (error) {
      console.error('位置情報削除エラー:', error);
      showMessage('位置情報の削除に失敗しました', 'error');
    }
  }

  /**
   * 天気データを取得して表示
   */
  async function loadWeatherData() {
    try {
      const apiSource = apiSourceFilter.value;
      const params = new URLSearchParams();
      if (apiSource) {
        params.append('apiSource', apiSource);
      }

      const response = await fetch(`${WEATHER_API}/data?${params}`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const weatherData = await response.json();
      displayWeatherData(weatherData);
    } catch (error) {
      console.error('天気データ取得エラー:', error);
      showMessage('天気データの取得に失敗しました', 'error');
    }
  }

  /**
   * 天気データを画面に表示
   * @param {Array} weatherData - 天気データ配列
   */
  function displayWeatherData(weatherData) {
    if (weatherData.length === 0) {
      weatherContainer.innerHTML = '<p class="no-data">天気データがありません</p>';
      return;
    }

    // 成功したデータのみフィルタリング
    const validWeatherData = weatherData.filter(data => data.success && data.data);

    if (validWeatherData.length === 0) {
      weatherContainer.innerHTML = '<p class="no-data">有効な天気データがありません</p>';
      return;
    }

    const weatherHtml = validWeatherData.map(data => {
      let weatherContent = '';
      
      try {
        if (data.apiSource === 'openmeteo') {
          weatherContent = formatOpenMeteoData(data.data);
        } else if (data.apiSource === 'weatherapi') {
          weatherContent = formatWeatherAPIData(data.data);
        } else if (data.apiSource === 'yahoo') {
          weatherContent = formatYahooWeatherData(data.data);
        } else {
          weatherContent = '<p>未対応のAPIソースです</p>';
        }
      } catch (error) {
        console.error('天気データフォーマットエラー:', error);
        weatherContent = '<p>データの表示でエラーが発生しました</p>';
      }

      return `
        <div class="weather-card">
          <div class="weather-header">
            <h3>位置ID: ${data.locationId}</h3>
            <span class="api-source-badge api-source-${data.apiSource}">${getAPISourceName(data.apiSource)}</span>
          </div>
          <div class="weather-content">
            ${weatherContent}
          </div>
          <div class="weather-footer">
            <small>取得日時: ${formatDate(data.createdAt)}</small>
          </div>
        </div>
      `;
    }).join('');

    weatherContainer.innerHTML = weatherHtml;
  }

  /**
   * Open Meteo APIデータのフォーマット
   * @param {Object} data - Open Meteo APIレスポンス
   * @returns {string} HTML文字列
   */
  function formatOpenMeteoData(data) {
    const current = data.current;
    const daily = data.daily;
    
    return `
      <div class="current-weather">
        <h4>現在の天気</h4>
        <p><strong>気温:</strong> ${current.temperature_2m}°C</p>
        <p><strong>湿度:</strong> ${current.relative_humidity_2m}%</p>
        <p><strong>風速:</strong> ${current.wind_speed_10m} m/s</p>
        <p><strong>天気コード:</strong> ${current.weather_code}</p>
      </div>
      <div class="forecast">
        <h4>7日間予報</h4>
        ${daily.time.slice(0, 3).map((date, index) => `
          <div class="forecast-day">
            <p><strong>${formatDate(date)}:</strong></p>
            <p>最高: ${daily.temperature_2m_max[index]}°C / 最低: ${daily.temperature_2m_min[index]}°C</p>
            <p>降水量: ${daily.precipitation_sum[index]}mm</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * WeatherAPI.comデータのフォーマット
   * @param {Object} data - WeatherAPI.comレスポンス
   * @returns {string} HTML文字列
   */
  function formatWeatherAPIData(data) {
    const current = data.current;
    const forecast = data.forecast;
    
    return `
      <div class="current-weather">
        <h4>現在の天気</h4>
        <p><strong>気温:</strong> ${current.temp_c}°C</p>
        <p><strong>体感温度:</strong> ${current.feelslike_c}°C</p>
        <p><strong>湿度:</strong> ${current.humidity}%</p>
        <p><strong>風速:</strong> ${current.wind_kph} km/h</p>
        <p><strong>天気:</strong> ${current.condition.text}</p>
      </div>
      <div class="forecast">
        <h4>予報</h4>
        ${forecast.forecastday.slice(0, 3).map(day => `
          <div class="forecast-day">
            <p><strong>${formatDate(day.date)}:</strong></p>
            <p>最高: ${day.day.maxtemp_c}°C / 最低: ${day.day.mintemp_c}°C</p>
            <p>天気: ${day.day.condition.text}</p>
            <p>降水確率: ${day.day.daily_chance_of_rain}%</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Yahoo Weather APIデータのフォーマット
   * @param {Object} data - Yahoo Weather APIレスポンス
   * @returns {string} HTML文字列
   */
  function formatYahooWeatherData(data) {
    try {
      // Yahoo Weather API の基本的な構造を確認
      if (!data || !data.Feature || !Array.isArray(data.Feature) || data.Feature.length === 0) {
        return `
          <div class="current-weather">
            <h4>Yahoo Weather データ</h4>
            <p>有効な天気データが取得できませんでした</p>
          </div>
        `;
      }

      const feature = data.Feature[0];
      const property = feature.Property || {};
      const weatherList = property.WeatherList || {};
      const weatherData = weatherList.Weather || [];

      // 位置情報
      const locationName = feature.Name || '不明な地点';
      const coordinates = feature.Geometry?.Coordinates || '';

      let weatherContent = `
        <div class="current-weather">
          <h4>現在の天気 - ${escapeHtml(locationName)}</h4>
          ${coordinates ? `<p><strong>座標:</strong> ${escapeHtml(coordinates)}</p>` : ''}
      `;

      // 天気予報データの処理
      if (weatherData.length > 0) {
        weatherContent += `</div><div class="forecast"><h4>天気予報</h4>`;
        
        weatherData.slice(0, 7).forEach(weather => {
          const date = weather.Date || '';
          const type = weather.Type || '';
          const rainfall = weather.Rainfall !== undefined && weather.Rainfall !== null && weather.Rainfall !== '' 
            ? `${weather.Rainfall}mm` 
            : '0mm';
          const temperature = weather.Temperature || {};
          
          // 日付フォーマット (YYYYMMDD → YYYY/MM/DD)
          let formattedDate = date;
          if (date && date.length === 8) {
            formattedDate = `${date.substring(0, 4)}/${date.substring(4, 6)}/${date.substring(6, 8)}`;
          }
          
          // 日本語での種類表示
          let typeLabel = type;
          switch (type) {
            case 'today': typeLabel = '今日'; break;
            case 'tomorrow': typeLabel = '明日'; break;
            default: typeLabel = type || '予報';
          }

          weatherContent += `
            <div class="forecast-day">
              <p><strong>${typeLabel}${formattedDate ? ` (${formattedDate})` : ''}:</strong></p>
              ${temperature.Min?.Celsius ? `<p>最低気温: ${temperature.Min.Celsius}°C</p>` : ''}
              ${temperature.Max?.Celsius ? `<p>最高気温: ${temperature.Max.Celsius}°C</p>` : ''}
              <p>降水量: ${rainfall}</p>
            </div>
          `;
        });
        
        weatherContent += `</div>`;
      } else {
        weatherContent += `<p>天気予報データがありません</p></div>`;
      }

      // エリアコード情報があれば表示
      if (property.WeatherAreaCode) {
        weatherContent += `
          <div class="weather-info">
            <p><small>天気エリアコード: ${escapeHtml(property.WeatherAreaCode)}</small></p>
          </div>
        `;
      }

      return weatherContent;

    } catch (error) {
      console.error('Yahoo Weather データの解析エラー:', error);
      return `
        <div class="current-weather">
          <h4>Yahoo Weather データ</h4>
          <p>データの解析中にエラーが発生しました</p>
          <details>
            <summary>詳細なデータ (トラブルシューティング用)</summary>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </details>
        </div>
      `;
    }
  }

  /**
   * APIソース名を取得
   * @param {string} apiSource - APIソース
   * @returns {string} APIソース名
   */
  function getAPISourceName(apiSource) {
    const names = {
      'openmeteo': 'Open Meteo',
      'weatherapi': 'WeatherAPI',
      'yahoo': 'Yahoo Weather'
    };
    return names[apiSource] || apiSource;
  }

  /**
   * HTML文字列をエスケープ
   * @param {string} text - エスケープする文字列
   * @returns {string} エスケープされた文字列
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 日付を読みやすい形式でフォーマット
   * @param {string} dateString - ISO日付文字列
   * @returns {string} フォーマットされた日付文字列
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  }

  /**
   * フォームをリセット
   */
  function resetLocationForm() {
    locationForm.reset();
    locationIdInput.value = '';
    locationFormTitle.textContent = '新しい位置情報を追加';
    locationSubmitBtn.textContent = '追加';
    locationFormSection.style.display = 'none';
  }

  // イベントリスナーの設定

  // 位置情報追加ボタン
  addLocationBtn.addEventListener('click', () => {
    resetLocationForm();
    locationFormSection.style.display = 'block';
    locationFormSection.scrollIntoView({ behavior: 'smooth' });
  });

  // 位置情報フォーム送信
  locationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const locationData = {
      name: locationNameInput.value.trim(),
      latitude: parseFloat(latitudeInput.value),
      longitude: parseFloat(longitudeInput.value),
      description: descriptionInput.value.trim()
    };

    // バリデーション
    if (!locationData.name || isNaN(locationData.latitude) || isNaN(locationData.longitude)) {
      showMessage('位置名、緯度、経度は必須です', 'error');
      return;
    }

    try {
      const isEdit = locationIdInput.value !== '';
      const url = isEdit ? `${LOCATIONS_API}/${locationIdInput.value}` : LOCATIONS_API;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      showMessage(`位置情報を${isEdit ? '更新' : '追加'}しました`, 'success');
      resetLocationForm();
      await loadLocations();
    } catch (error) {
      console.error('位置情報保存エラー:', error);
      showMessage(`位置情報の${locationIdInput.value ? '更新' : '追加'}に失敗しました`, 'error');
    }
  });

  // フォームキャンセルボタン
  locationCancelBtn.addEventListener('click', () => {
    resetLocationForm();
  });

  // 位置情報更新ボタン
  refreshLocationsBtn.addEventListener('click', () => {
    loadLocations();
  });

  // 天気データ更新ボタン
  refreshWeatherBtn.addEventListener('click', () => {
    loadWeatherData();
  });

  // APIソースフィルター変更
  apiSourceFilter.addEventListener('change', () => {
    loadWeatherData();
  });

  // 初期データロード
  await loadLocations();
  await loadWeatherData();
});