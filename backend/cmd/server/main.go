package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gokceguler/portfolio/backend/internal/handler"
	authmw "github.com/gokceguler/portfolio/backend/internal/middleware"
	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/gokceguler/portfolio/backend/internal/store"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

func main() {
	seed := flag.Bool("seed", false, "seed initial portfolio content")
	createAdmin := flag.String("create-admin", "", "create or replace admin, username:password")
	flag.Parse()
	port := env("PORT", "8080")
	dbPath := env("DATABASE_PATH", "./data/portfolio.db")
	uploadDir := env("UPLOAD_DIR", "./data/uploads")
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		log.Fatal("database directory: ", err)
	}
	db, err := sqlx.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if err = store.Migrate(db); err != nil {
		log.Fatal("migration: ", err)
	}
	if *seed {
		if err = store.Seed(db); err != nil {
			log.Fatal("seed: ", err)
		}
	}
	s := store.New(db)
	s.PurgeSessions()
	if *createAdmin != "" {
		username, password, ok := strings.Cut(*createAdmin, ":")
		if !ok || username == "" || len(password) < 12 {
			log.Fatal("use username:password with at least 12 password characters")
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err = s.CreateAdmin(&model.AdminUser{Username: username, PasswordHash: string(hash)}); err != nil {
			log.Fatal(err)
		}
		log.Printf("admin %q created", username)
		return
	}
	publicHandler := handler.NewPublicHandler(s)
	adminHandler := handler.NewAdminHandler(s)
	mediaHandler := handler.NewMediaHandler(uploadDir)
	loginLimiter := authmw.NewRateLimiter(8, time.Minute)
	r := chi.NewRouter()
	r.Use(chimw.RequestID, chimw.RealIP, chimw.Logger, chimw.Recoverer, chimw.Timeout(15*time.Second))
	r.Use(authmw.SecurityHeaders)
	r.Use(cors.Handler(cors.Options{AllowedOrigins: strings.Split(env("CORS_ORIGINS", "http://localhost:3000"), ","), AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"}, AllowCredentials: true, MaxAge: 300}))
	r.Get("/healthz", publicHandler.Health)
	r.Get("/api/v1/portfolio", publicHandler.Portfolio)
	r.Get("/uploads/{name}", mediaHandler.Serve)
	r.With(loginLimiter.Limit).Post("/api/v1/admin/login", adminHandler.Login)
	r.Group(func(r chi.Router) {
		r.Use(authmw.AdminAuth(s))
		r.Post("/api/v1/admin/logout", adminHandler.Logout)
		r.Get("/api/v1/admin/me", adminHandler.Me)
		r.Post("/api/v1/admin/media", mediaHandler.Upload)
		r.Get("/api/v1/admin/content/{kind}", adminHandler.ListContent)
		r.Post("/api/v1/admin/content/{kind}", adminHandler.CreateContent)
		r.Put("/api/v1/admin/content/{kind}/{id}", adminHandler.UpdateContent)
		r.Delete("/api/v1/admin/content/{kind}/{id}", adminHandler.DeleteContent)
		r.Get("/api/v1/admin/settings", adminHandler.GetSettings)
		r.Put("/api/v1/admin/settings", adminHandler.UpdateSettings)
		r.Delete("/api/v1/admin/settings/{key}", adminHandler.DeleteSetting)
	})
	server := &http.Server{Addr: ":" + port, Handler: r, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 20 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("portfolio API listening on %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
