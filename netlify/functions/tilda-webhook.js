

exports.handler = async (event) => {
  const userIP = event.headers['x-nf-client-connection-ip'] || 
                  event.headers['x-forwarded-for'] || 
                  'IP не найден';

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

  const version = formData.version || 'версия не указана';

  const now = new Date();
  const moscowTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const receivedAt = moscowTime.toISOString().slice(0, 19).replace('T', ' ');

  const logEntry = {
    status: 'ok',
    received_at: receivedAt,
    ip_address: userIP,
    version: version,
    email: formData.email || '',
    name: formData.name || '',
    phone: formData.phone || ''
  };

  console.log('Получена заявка:', JSON.stringify(logEntry));

    const albatoUrl = 'https://h.albato.ru/wh/38/1lfd22k/Ywxq8r_LQFuTxIpbQdPnr2gBnwQx0d1XSIs1pMeJplI/';
    await fetch(albatoUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logEntry)
    });
  return {
    statusCode: 200,
    body: JSON.stringify(logEntry)
  };
};