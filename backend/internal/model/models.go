package model

import "time"

type ContentItem struct {
	ID        int64     `db:"id" json:"id"`
	Kind      string    `db:"kind" json:"kind"`
	Slug      string    `db:"slug" json:"slug"`
	Data      string    `db:"data" json:"-"`
	SortOrder int       `db:"sort_order" json:"sort_order"`
	Visible   bool      `db:"visible" json:"visible"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type AdminUser struct {
	ID           int64     `db:"id" json:"id"`
	Username     string    `db:"username" json:"username"`
	PasswordHash string    `db:"password_hash" json:"-"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}
