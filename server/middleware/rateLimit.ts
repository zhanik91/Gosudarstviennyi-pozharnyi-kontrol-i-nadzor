import rateLimit from 'express-rate-limit';

// Rate limiting для аутентификации
export const authRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 10, // 10 попыток на IP
  message: {
    error: 'Too many authentication attempts',
    message: 'Слишком много попыток входа. Попробуйте через 5 минут.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Пропускаем для локальной разработки
    return req.ip === '127.0.0.1' || req.ip === '::1';
  }
});

// Rate limiting для API
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 100, // 100 запросов на IP
  message: {
    error: 'Too many API requests',
    message: 'Превышен лимит запросов к API. Попробуйте позже.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Пропускаем для локальной разработки
    return req.ip === '127.0.0.1' || req.ip === '::1';
  }
});

// Rate limiting для загрузки файлов
export const uploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  max: 5, // 5 загрузок на IP
  message: {
    error: 'Too many file uploads',
    message: 'Превышен лимит загрузки файлов. Попробуйте через 10 минут.',
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  authRateLimit,
  apiRateLimit,
  uploadRateLimit
};