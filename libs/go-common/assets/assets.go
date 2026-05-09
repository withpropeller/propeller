package assets

import (
	"embed"
	"fmt"
	"io/fs"
)

// SharedAssets embeds all shared static assets
//
//go:embed fonts/* images/* styles/* blacklisted-email-domains.conf
var SharedAssets embed.FS

// GetFont returns font data by filename
func GetFont(name string) ([]byte, error) {
	return SharedAssets.ReadFile(fmt.Sprintf("fonts/%s", name))
}

// GetImage returns image data by filename
func GetImage(name string) ([]byte, error) {
	return SharedAssets.ReadFile(fmt.Sprintf("images/%s", name))
}

// GetStyle returns CSS data by filename
func GetStyle(name string) ([]byte, error) {
	return SharedAssets.ReadFile(fmt.Sprintf("styles/%s", name))
}

// GetFS returns the embed.FS for advanced usage
func GetFS() fs.FS {
	return SharedAssets
}

// ListFonts returns all available fonts
func ListFonts() ([]string, error) {
	return listFiles("fonts")
}

// ListImages returns all available images
func ListImages() ([]string, error) {
	return listFiles("images")
}

// ListStyles returns all available styles
func ListStyles() ([]string, error) {
	return listFiles("styles")
}

func listFiles(dir string) ([]string, error) {
	entries, err := SharedAssets.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() {
			files = append(files, entry.Name())
		}
	}
	return files, nil
}
