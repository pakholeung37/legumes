# Legumes Playground

A modern Vite-based playground for the Legumes sheet music library, featuring a refactored ES module editor.

## Features

- **Modern ES Module Architecture**: Refactored from legacy CommonJS to modern ES modules
- **React Integration**: Built with React and TypeScript for better development experience
- **CodeMirror Editor**: Syntax highlighting for Legumes notation
- **MIDI Playback**: Real-time MIDI playback with Tone.js
- **Export Options**: Export to SVG, PDF, and MIDI formats
- **Sample Files**: Built-in sample music files for testing

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open your browser to `http://localhost:5173`

## Architecture

### File Structure

```
packages/playground/
├── src/
│   ├── components/
│   │   └── legumes-editor.tsx      # React component wrapper
│   ├── utils/
│   │   └── sample-loader.ts        # Sample file loading utility
│   ├── types/
│   │   └── legumes.d.ts            # TypeScript declarations
│   ├── legumes-editor.ts           # Main ES module editor
│   ├── App.tsx                     # Main app component
│   └── main.tsx                    # Entry point
├── index.html                      # HTML template with external deps
└── package.json
```

### Key Components

#### `legumes-editor.ts`
The main ES module that contains:
- `LegumesEditor` class with all editor functionality
- CodeMirror mode definition for Legumes syntax
- MIDI playback and export utilities
- File upload/download utilities

#### `legumes-editor.tsx`
React component that:
- Wraps the ES module editor
- Handles loading states and errors
- Provides the UI structure

#### `sample-loader.ts`
Utility for loading sample music files with:
- Built-in sample files
- Helper functions for sample management

## Usage

### Basic Usage

The editor automatically loads when you start the development server. You can:

1. **Edit Music**: Use the CodeMirror editor on the right side
2. **Compile**: Click the 🔨 button to render the music
3. **Play**: Click the 🔊 button to play MIDI
4. **Export**: Use the export functions to save as SVG, PDF, or MIDI

### Sample Files

The editor includes several sample files:
- `mozart_turkish_march.txt` - Mozart's Turkish March
- `simple_scale.txt` - A simple C major scale
- `chord_progression.txt` - Basic chord progression

### Legumes Syntax

The editor supports the Legumes notation syntax:

```txt
title "My Song"
composer "Composer Name"
tempo 120

measure
  note C4 1/4
  note D4 1/4
  note E4 1/4
  note F4 1/4
end
```

## Development

### Adding New Features

1. **New Editor Functions**: Add methods to the `LegumesEditor` class
2. **UI Components**: Create new React components in `src/components/`
3. **Utilities**: Add utility functions in `src/utils/`
4. **Types**: Update type definitions in `src/types/`

### External Dependencies

The editor requires several external libraries loaded via CDN:
- CodeMirror 5.58.1 (editor)
- Tone.js 14.8.17 (MIDI playback)
- dat.GUI 0.7.7 (configuration UI)
- menu2html (menu system)

These are loaded in `index.html` to avoid bundling issues.

### Building for Production

```bash
pnpm build
```

This creates an optimized build in the `dist/` directory.

## Migration from Legacy

The refactored editor maintains compatibility with the original functionality while providing:

- **Better Type Safety**: Full TypeScript support
- **Modern Module System**: ES modules instead of CommonJS
- **React Integration**: Better state management and UI
- **Improved Error Handling**: Graceful error states
- **Better Development Experience**: Hot reload, better debugging

## Troubleshooting

### Common Issues

1. **CodeMirror not loading**: Check that external scripts are loading in browser dev tools
2. **MIDI playback issues**: Ensure Tone.js is loaded and audio context is initialized
3. **Type errors**: Make sure TypeScript declarations are up to date

### Debug Mode

Enable debug logging by setting:
```typescript
localStorage.setItem('legumes-debug', 'true')
```

## Contributing

1. Follow the existing code style and naming conventions
2. Add TypeScript types for new features
3. Update documentation for new functionality
4. Test with different sample files

## License

Same as the main Legumes project.
