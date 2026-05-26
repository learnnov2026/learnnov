import time
import logging

logger = logging.getLogger(__name__)

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=60, call_timeout=5):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.call_timeout = call_timeout
        
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'

    def call(self, func, *args, **kwargs):
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'HALF_OPEN'
            else:
                logger.warning("Circuit breaker is OPEN. Fast failing.")
                raise CircuitBreakerOpenException("Circuit breaker is OPEN")

        try:
            # We would typically use something like signals or concurrent.futures to enforce `call_timeout`
            # For simplicity in synchronous context, we assume the underlying `func` supports a timeout
            # e.g., requests.get(url, timeout=self.call_timeout)
            kwargs['timeout'] = kwargs.get('timeout', self.call_timeout)
            
            result = func(*args, **kwargs)
            
            if self.state == 'HALF_OPEN':
                self.state = 'CLOSED'
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = 'OPEN'
                logger.error(f"Circuit breaker tripped OPEN after {self.failure_count} failures. Last error: {str(e)}")
            raise e

circuit_breaker = CircuitBreaker()
