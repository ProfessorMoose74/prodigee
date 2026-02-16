import json
import hashlib
from typing import Any, Optional, Callable
from functools import wraps
import redis
from redis import Redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    def __init__(self):
        self.redis_client: Optional[Redis] = None
        self.ttl = settings.CACHE_TTL
        self._connect()
    
    def _connect(self):
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.warning(f"Redis connection failed: {str(e)}. Running without cache.")
            self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        if not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        if not self.redis_client:
            return False
        
        try:
            serialized = json.dumps(value)
            self.redis_client.setex(key, ttl or self.ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Cache clear pattern error: {str(e)}")
        
        return 0
    
    @staticmethod
    def make_key(*args, **kwargs) -> str:
        key_data = {
            'args': args,
            'kwargs': kwargs
        }
        serialized = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(serialized.encode()).hexdigest()


cache_manager = CacheManager()


def cache_result(ttl: Optional[int] = None, prefix: str = ""):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            cache_key = f"{prefix}:{func.__name__}:{CacheManager.make_key(*args, **kwargs)}"
            
            cached = cache_manager.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached
            
            result = await func(*args, **kwargs)
            cache_manager.set(cache_key, result, ttl)
            logger.debug(f"Cached result for {cache_key}")
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            cache_key = f"{prefix}:{func.__name__}:{CacheManager.make_key(*args, **kwargs)}"
            
            cached = cache_manager.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached
            
            result = func(*args, **kwargs)
            cache_manager.set(cache_key, result, ttl)
            logger.debug(f"Cached result for {cache_key}")
            
            return result
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


import asyncio