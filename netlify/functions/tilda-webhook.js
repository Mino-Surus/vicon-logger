// netlify/functions/tilda-webhook.js
// Упрощённая версия — только логируем IP, без Google Sheets

exports.handler = async (event) => {
  // 1. Получаем IP-адрес (Netlify сам добавляет этот заголовок!)
  const userIP = event.headers['x-nf-client-connection-ip'] || 
                  event.headers['x-forwarded-for'] || 
                  'IP не найден';

  // 2. Разбираем данные формы
  let formData = {};
  if (event.body) {
    try {
      // Пробуем как JSON
      formData = JSON.parse(event.body);
    } catch(e) {
      // Если не JSON — пробуем как form-urlencoded
      const params = new URLSearchParams(event.body);
      for (const [key, value] of params) {
        formData[key] = value;
      }
    }
  }

  // 3. Получаем версию согласия
  const version = formData.version || 'версия не указана';

  // 4. Текущая дата и время (Москва)
  const now = new Date();
  const moscowTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const receivedAt = moscowTime.toISOString().slice(0, 19).replace('T', ' ');

  // 5. Всё, что нужно залогировать
  const logEntry = {
    status: 'ok',
    received_at: receivedAt,
    ip_address: userIP,
    version: version,
    email: formData.email || '',
    name: formData.name || '',
    phone: formData.phone || ''
  };

  // Выводим в лог Netlify (для отладки)
  console.log('Получена заявка:', JSON.stringify(logEntry));

  // 6. Возвращаем ответ Tilda
  return {
    statusCode: 200,
    body: JSON.stringify(logEntry)
  };
};