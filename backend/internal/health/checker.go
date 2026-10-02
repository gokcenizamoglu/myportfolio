package health

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type FileChecker struct {
	publicSiteURL string
	uploadDir     string
	client        *http.Client
}

func NewFileChecker(publicSiteURL, uploadDir string) *FileChecker {
	return &FileChecker{publicSiteURL: strings.TrimRight(publicSiteURL, "/"), uploadDir: uploadDir, client: &http.Client{Timeout: 3 * time.Second}}
}

func (c *FileChecker) Reachable(raw string) bool {
	if strings.HasPrefix(raw, "/uploads/") {
		name := filepath.Base(raw)
		if name == "." || name == "" {
			return false
		}
		info, err := os.Stat(filepath.Join(c.uploadDir, name))
		return err == nil && !info.IsDir()
	}
	target := raw
	if strings.HasPrefix(raw, "/documents/") || strings.HasPrefix(raw, "/certifications/") {
		target = c.publicSiteURL + raw
	}
	parsed, err := url.Parse(target)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return false
	}
	request, err := http.NewRequest(http.MethodHead, target, nil)
	if err != nil {
		return false
	}
	response, err := c.client.Do(request)
	if err != nil {
		return false
	}
	defer response.Body.Close()
	return response.StatusCode >= 200 && response.StatusCode < 400
}
