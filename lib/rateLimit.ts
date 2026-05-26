// lib/rateLimit.ts

interface RateLimitRecord {
    count: number;
    resetAt: number;
  }
  
  const rateLimitMap = new Map<string, RateLimitRecord>();
  const CLEANUP_INTERVAL = 60 * 1000; // 1 минута
  
  // Очистка устаревших записей
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  
  interface RateLimitOptions {
    windowMs?: number;   // окно в миллисекундах
    maxRequests?: number; // макс запросов за окно
  }
  
  export function rateLimit(options: RateLimitOptions = {}) {
    const windowMs = options.windowMs || 60 * 1000; // по умолчанию 1 минута
    const maxRequests = options.maxRequests || 30;   // по умолчанию 30 запросов
  
    return {
      check: (identifier: string): { success: boolean; remaining: number; resetAt: number } => {
        const now = Date.now();
        const record = rateLimitMap.get(identifier);
  
        if (!record || now > record.resetAt) {
          // Новый период
          rateLimitMap.set(identifier, {
            count: 1,
            resetAt: now + windowMs,
          });
          return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs };
        }
  
        if (record.count >= maxRequests) {
          return { success: false, remaining: 0, resetAt: record.resetAt };
        }
  
        record.count++;
        rateLimitMap.set(identifier, record);
        return { success: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
      },
    };
  }
  
  // Функция для получения идентификатора клиента (IP + путь)
  export function getRateLimitKey(req: Request, type: string = "api"): string {
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "unknown";
    return `${type}:${ip}`;
  }