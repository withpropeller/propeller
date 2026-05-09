# Shared Assets

This directory contains static assets shared across all worker services.

## Structure

```
assets/
├── fonts/          # Typography assets
│   ├── Inter-Regular.ttf
│   └── Inter-Bold.ttf
├── images/         # Visual assets
│   ├── logo.png           # Primary logo (light background)
│   ├── logo-dark.png      # Logo for dark backgrounds
│   └── favicon.ico        # Favicon
└── styles/         # CSS/SCSS stylesheets
    └── common.css         # Shared styles for HTML templates
```

## Usage in Workers

### In Go Code

```go
import "embed"

//go:embed all:../../../libs/go-common/assets
var sharedAssets embed.FS

// Access logo
logoData, _ := sharedAssets.ReadFile("libs/go-common/assets/images/logo.png")
```

### In Templates

```html
<!-- Reference assets via base64 embedding or hosted URL -->
<img src="data:image/png;base64,{{.Logo}}" alt="Stanza Logo">
```

### In PDF Generation

```go
// Embed font for PDF
fontPath := "libs/go-common/assets/fonts/Inter-Regular.ttf"
fontData, _ := sharedAssets.ReadFile(fontPath)
```

## Adding New Assets

1. Place asset in appropriate subdirectory
2. Update this README
3. Commit and push
4. Workers will automatically include on next build

## Asset Guidelines

- **Images**: Use PNG for logos (with transparency), JPG for photos
- **Fonts**: Include only necessary font weights to reduce size
- **Styles**: Keep common styles minimal, let workers override
- **Size**: Keep assets reasonably sized (<500KB per file)

## License

All assets are property of Stanza and should not be used outside this project.

