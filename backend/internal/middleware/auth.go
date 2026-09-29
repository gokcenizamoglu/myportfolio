package middleware

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gokceguler/portfolio/backend/internal/store"
)

type contextKey string

const adminKey contextKey = "admin"

// AdminFromContext returns the authenticated admin username attached by
// AdminAuth, or an empty string if the request was not authenticated.
func AdminFromContext(ctx context.Context) string {
	username, _ := ctx.Value(adminKey).(string)
	return username
}

func AdminAuth(s *store.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("portfolio_session")
			if err != nil {
				unauthorized(w)
				return
			}
			username, err := s.SessionUser(cookie.Value)
			if err != nil {
				unauthorized(w)
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), adminKey, username)))
		})
	}
}

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
}
