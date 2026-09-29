package middleware

import "net/http"

// SecurityHeaders sets conservative defaults for a JSON API that also serves
// uploaded media. The API never renders HTML, so a strict frame/referrer
// posture costs nothing and closes off clickjacking and referrer leakage.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-site")
		next.ServeHTTP(w, r)
	})
}
