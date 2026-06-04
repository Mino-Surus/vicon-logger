// netlify/functions/tilda-webhook.js
// Функция для приёма данных из формы Tilda, добавления IP и записи в Google Sheets

const { GoogleSpreadsheet } = require('google-spreadsheet');

exports.handler = async (event, context) => {
  // 1. Разбираем входящие данные от Tilda
  let formData = {};
  try {
    // Tilda может отправлять данные в разных форматах
    if (event.body) {
      formData = JSON.parse(event.body);
    }
  } catch (e) {
    // Если не JSON, пробуем как form-data
    formData = event.body || {};
  }

  // 2. ПОЛУЧАЕМ IP-АДРЕС — это самое важное!
  // Netlify автоматически подставляет IP клиента в заголовок x-nf-client-connection-ip[citation:5][citation:6]
  const userIP = event.headers['x-nf-client-connection-ip'] || 
                  event.headers['x-forwarded-for'] || 
                  'IP не найден';

  // 3. Добавляем дату и время получения (Москва)
  const now = new Date();
  const moscowTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const receivedAt = moscowTime.toISOString().slice(0, 19).replace('T', ' ');

  // 4. Получаем версию согласия (из данных формы)
  const version = formData.version || 'версия не указана';

  // 5. Формируем запись для Google Sheets
  const sheetRow = {
    datetime: receivedAt,
    ip_address: userIP,
    version: version,
    email: formData.email || '',
    name: formData.name || '',
    phone: formData.phone || ''
  };

  // 6. Отправляем в Google Sheets (если настроены переменные окружения)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
      process.env.GOOGLE_PRIVATE_KEY && 
      process.env.GOOGLE_SPREADSHEET_ID) {
    try {
      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
      await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0];
      await sheet.addRow(sheetRow);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'ok', 
          message: 'Данные записаны в Google Sheets',
          ip: userIP 
        })
      };
    } catch (sheetError) {
      console.error('Ошибка записи в Google Sheets:', sheetError);
      // Всё равно возвращаем успех Tilda, но логируем ошибку
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'ok', 
          warning: 'Данные получены, но не записаны в таблицу',
          ip: userIP 
        })
      };
    }
  }

  // Если Google Sheets не настроен — просто возвращаем успех
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      status: 'ok', 
      message: 'Данные получены, IP зафиксирован',
      ip: userIP,
      version: version,
      received_at: receivedAt
    })
  };
};