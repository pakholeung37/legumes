# legumes

🎼 _A sheet music to polylines renderer_

**Samples | Online Editor | API | Syntax**

This is a fork of the original [legumes](https://github.com/LingDong-/legumes) project by [LingDong-](https://github.com/LingDong-).

## About

Legumes is a sheet music to polylines renderer that takes MIDI files or simple markup format as input and outputs polylines for animation, plotting, and various procedural drawing applications.

> 🚧 This project is a work in progress and currently supports a subset of sheet music notation. Errors and ugliness might occur from time to time. For professional quality scorewriting, check out [List of score writers](https://en.wikipedia.org/wiki/List_of_scorewriters) instead. 🚧

## Features

* Supports most everyday classical music symbols
* Exports polylines, SVG, PDF, GIF, MIDI and more
* Lightweight: < 150KB minified; No dependencies
* Uses Hershey Fonts for text and symbols; You can load custom hershey fonts for rendering unicode etc
* Includes basic animation and hand-drawn effects generator
* Use as browser/node.js library or commandline interface

## Project Structure

```
legumes/
├── packages/
│   ├── legumes/          # Main library package
│   │   ├── src/          # TypeScript source code
│   │   ├── samples/      # Example music files
│   │   ├── tests/        # Test files
│   │   └── tools/        # Development tools
│   └── playground/       # Web-based editor and playground
├── screenshots/          # Generated output examples
└── docs/                 # Documentation
```

## Quick Start

### Command Line

The `legc` executable is included in the repo. You can use it to render scores:

```bash
# Render a score to SVG
./legc --format svg samples/minuet_G.txt > output.svg

# Render with animation
./legc --format svg-anim --stem-length 3 --title-text-size 28 samples/minuet_G.txt > output.svg
```

### Programming Interface

```javascript
const legumes = require("dist/legumes");

// Parse text markup
const score = legumes.parse_txt(txt);

// Compile the score
legumes.compile_score(score);

// Render and export
let drawing = legumes.render_score(score);
let svg = legumes.export_svg(drawing);
```

### Web Editor

Try the online editor at [legumes.vercel.app](https://legumes.vercel.app/) for interactive editing with syntax highlighting and MIDI playback.

## Development

This is a monorepo using pnpm workspaces:

```bash
# Install dependencies
pnpm install

# Build the main package
cd packages/legumes
pnpm build

# Run the playground
cd ../playground
pnpm dev
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to the original author [LingDong-](https://github.com/LingDong-) for creating this amazing project.

---

*legumes is an acronym for "Lingdong's Erratic and Generally Useless Musical Engraving System".* 
