package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"sync"
	"time"
)

// RateLimiter is a fixed-window, per-client in-memory limiter. It is kept
// dependency-free on purpose: the admin surface is small and single-node, so a
// map guarded by a mutex plus a background janitor is enough to blunt
// credential brute-force without pulling in extra infrastructure.
type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*window
	limit    int
	window   time.Duration
}

type window struct {
	count int
	reset time.Time
}

func NewRateLimiter(limit int, per time.Duration) *RateLimiter {
	rl := &RateLimiter{visitors: make(map[string]*window), limit: limit, window: per}
	go rl.janitor()
	return rl
}

func (rl *RateLimiter) janitor() {
	ticker := time.NewTicker(rl.window)
	for range ticker.C {
		now := time.Now()
		rl.mu.Lock()
		for key, w := range rl.visitors {
			if now.After(w.reset) {
				delete(rl.visitors, key)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) allow(key string) bool {
	now := time.Now()
	rl.mu.Lock()
	defer rl.mu.Unlock()
	w, ok := rl.visitors[key]
	if !ok || now.After(w.reset) {
		rl.visitors[key] = &window{count: 1, reset: now.Add(rl.window)}
		return true
	}
	if w.count >= rl.limit {
		return false
	}
	w.count++
	return true
}

// Limit rejects a client once it exceeds the window. It keys on RemoteAddr,
// which chi's RealIP middleware has already resolved from the proxy headers.
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !rl.allow(clientKey(r)) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "too many requests, slow down"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func clientKey(r *http.Request) string {
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		return host
	}
	return r.RemoteAddr
}
