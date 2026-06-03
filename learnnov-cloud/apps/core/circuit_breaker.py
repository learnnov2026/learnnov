import time
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    def __init__(self, service_name="default", failure_threshold=3, recovery_timeout=60, call_timeout=5):
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.call_timeout = call_timeout

    @property
    def state_key(self):
        return f"cb:{self.service_name}:state"

    @property
    def fail_count_key(self):
        return f"cb:{self.service_name}:failures"

    @property
    def last_fail_time_key(self):
        return f"cb:{self.service_name}:last_fail"

    def get_state(self):
        return cache.get(self.state_key, "CLOSED")

    def call(self, func, *args, **kwargs):
        state = self.get_state()
        last_failure = cache.get(self.last_fail_time_key, 0.0)

        if state == 'OPEN':
            if time.time() - last_failure > self.recovery_timeout:
                cache.set(self.state_key, 'HALF_OPEN')
                state = 'HALF_OPEN'
            else:
                logger.warning(f"Circuit breaker for {self.service_name} is OPEN. Fast failing.")
                raise CircuitBreakerOpenException(f"Circuit breaker for {self.service_name} is OPEN")

        try:
            # We would typically use something like signals or concurrent.futures to enforce `call_timeout`
            # For simplicity in synchronous context, we assume the underlying `func` supports a timeout
            # e.g., requests.get(url, timeout=self.call_timeout)
            kwargs['timeout'] = kwargs.get('timeout', self.call_timeout)
            
            result = func(*args, **kwargs)
            
            if state == 'HALF_OPEN':
                cache.set(self.state_key, 'CLOSED')
                cache.set(self.fail_count_key, 0)
            return result
        except Exception as e:
            failures = cache.get(self.fail_count_key, 0) + 1
            cache.set(self.fail_count_key, failures)
            cache.set(self.last_fail_time_key, time.time())
            if failures >= self.failure_threshold:
                cache.set(self.state_key, 'OPEN')
                logger.error(f"Circuit breaker {self.service_name} tripped OPEN after {failures} failures. Last error: {str(e)}")
            raise e

circuit_breaker = CircuitBreaker()
