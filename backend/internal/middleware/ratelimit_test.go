package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiterBlocksBurst(t *testing.T) {
	rl := NewRateLimiter(3, time.Minute)
	handler := rl.Limit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	call := func() int {
		req := httptest.NewRequest(http.MethodPost, "/login", nil)
		req.RemoteAddr = "203.0.113.7:5000"
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		return rec.Code
	}

	for i := 0; i < 3; i++ {
		if code := call(); code != http.StatusOK {
			t.Fatalf("request %d should pass, got %d", i+1, code)
		}
	}
	if code := call(); code != http.StatusTooManyRequests {
		t.Fatalf("4th request should be limited, got %d", code)
	}
}

func TestRateLimiterIsolatesClients(t *testing.T) {
	rl := NewRateLimiter(1, time.Minute)
	handler := rl.Limit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	call := func(addr string) int {
		req := httptest.NewRequest(http.MethodPost, "/login", nil)
		req.RemoteAddr = addr
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		return rec.Code
	}

	if code := call("198.51.100.1:1111"); code != http.StatusOK {
		t.Fatalf("first client should pass, got %d", code)
	}
	// A different client must not inherit the first client's spent budget.
	if code := call("198.51.100.2:2222"); code != http.StatusOK {
		t.Fatalf("second client should pass on its own budget, got %d", code)
	}
	if code := call("198.51.100.1:9999"); code != http.StatusTooManyRequests {
		t.Fatalf("first client should now be limited regardless of port, got %d", code)
	}
}
