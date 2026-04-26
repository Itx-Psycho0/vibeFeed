import { createClient } from 'redis';

let redisClient;

export const connectRedis = async () => {
  if (process.env.REDIS_URL) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('error', (err) => console.log('Redis Client Error', err));

    await redisClient.connect();
    console.log(`
          ╔══════════════════════════════════════╗
          ║   Redis Connected successfully       ║
          ╚══════════════════════════════════════╝
    `);
  } else {
    console.warn('REDIS_URL not found. Running without Redis cache.');
  }
};

export const getRedisClient = () => redisClient;
