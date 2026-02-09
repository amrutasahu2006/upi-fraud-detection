const { getRedisClient } = require('../config/redis');
const BlacklistVPA = require('../models/BlacklistVPA');

const VPA_CACHE_PREFIX = 'vpa:';
const CACHE_TTL = 1800; // 30 minutes in seconds

class VPACacheService {
  /**
   * Check VPA status (cached or DB lookup)
   * @param {string} vpa - VPA to check
   * @returns {Object} { flagged: boolean, data: object | null }
   */
  static async checkVPA(vpa) {
    const redisClient = getRedisClient();
    const normalizedVPA = vpa.toLowerCase().trim();
    const cacheKey = `${VPA_CACHE_PREFIX}${normalizedVPA}`;

    try {
      // Step 1: Check Redis cache (only if connected and ready)
      if (redisClient && redisClient.status === 'ready') {
        try {
          const cached = await redisClient.get(cacheKey);
          
          if (cached !== null) {
            console.log(`✅ Cache HIT for VPA: ${normalizedVPA}`);
            
            if (cached === 'safe') {
              return { flagged: false, data: null };
            }
            
            // Parse flagged VPA data from cache
            try {
              const data = JSON.parse(cached);
              return { flagged: true, data };
            } catch (parseError) {
              console.error('Cache parse error:', parseError);
            }
          }
        } catch (redisError) {
          console.warn('Redis error, falling back to DB:', redisError.message);
        }
      }

      console.log(`⚠️ Cache MISS for VPA: ${normalizedVPA} - Checking DB`);

      // Step 2: Check database
      const blacklistedVPA = await BlacklistVPA.findOne({ 
        vpa: normalizedVPA,
        status: 'active'
      });

      console.log(`🔍 DB Query Result for ${normalizedVPA}:`, blacklistedVPA ? `FOUND (${blacklistedVPA.risk_level})` : 'NOT FOUND');

      if (blacklistedVPA) {
        const flaggedData = {
          vpa: blacklistedVPA.vpa,
          risk_level: blacklistedVPA.risk_level,
          reason: blacklistedVPA.reason,
          confidence_score: blacklistedVPA.confidence_score,
          reported_at: blacklistedVPA.reported_at
        };

        // Cache flagged VPA (only if Redis is ready)
        if (redisClient && redisClient.status === 'ready') {
          try {
            await redisClient.setex(
              cacheKey,
              CACHE_TTL,
              JSON.stringify(flaggedData)
            );
          } catch (cacheError) {
            console.warn('Redis cache set failed:', cacheError.message);
          }
        }

        return { flagged: true, data: flaggedData };
      }

      // Step 3: VPA is safe - cache it
      if (redisClient && redisClient.status === 'ready') {
        try {
          await redisClient.setex(cacheKey, CACHE_TTL, 'safe');
        } catch (cacheError) {
          console.warn('Redis cache set failed:', cacheError.message);
        }
      }

      return { flagged: false, data: null };

    } catch (error) {
      console.error('VPA check error:', error);
      
      // Fallback to DB-only check if cache fails
      const blacklistedVPA = await BlacklistVPA.findOne({ 
        vpa: normalizedVPA,
        status: 'active'
      });

      if (blacklistedVPA) {
        return { 
          flagged: true, 
          data: {
            vpa: blacklistedVPA.vpa,
            risk_level: blacklistedVPA.risk_level,
            reason: blacklistedVPA.reason,
            confidence_score: blacklistedVPA.confidence_score,
            reported_at: blacklistedVPA.reported_at
          }
        };
      }

      return { flagged: false, data: null };
    }
  }

  /**
   * Invalidate VPA cache (after blacklist update)
   * @param {string} vpa - VPA to invalidate
   */
  static async invalidateVPA(vpa) {
    const redisClient = getRedisClient();
    if (!redisClient) return;

    const normalizedVPA = vpa.toLowerCase().trim();
    const cacheKey = `${VPA_CACHE_PREFIX}${normalizedVPA}`;

    try {
      await redisClient.del(cacheKey);
      console.log(`🗑️ Cache invalidated for VPA: ${normalizedVPA}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Clear all VPA cache
   */
  static async clearAllCache() {
    const redisClient = getRedisClient();
    if (!redisClient) return;

    try {
      const keys = await redisClient.keys(`${VPA_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`🗑️ Cleared ${keys.length} VPA cache entries`);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    const redisClient = getRedisClient();
    if (!redisClient) {
      return { enabled: false };
    }

    try {
      const keys = await redisClient.keys(`${VPA_CACHE_PREFIX}*`);
      const info = await redisClient.info('stats');
      
      return {
        enabled: true,
        total_keys: keys.length,
        redis_info: info
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { enabled: false, error: error.message };
    }
  }
}

module.exports = VPACacheService;
