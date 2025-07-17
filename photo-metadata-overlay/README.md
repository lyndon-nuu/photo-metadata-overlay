# Photo Metadata Overlay

A desktop application built with Tauri + React + TypeScript for adding customizable metadata overlays to photos.

## Features

- 📸 Photo selection and viewing
- 🎨 Customizable metadata overlays
- 📊 EXIF data extraction and display
- 💾 Template saving and loading
- 🖼️ Export photos with overlays
- 🎯 Cross-platform desktop support

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Tauri 2.0
- **UI Components**: Ant Design
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Canvas Manipulation**: Fabric.js
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable)
- System dependencies for Tauri (see [Tauri Prerequisites](https://tauri.app/start/prerequisites/))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run Tauri development mode
npm run tauri dev

# Build Tauri application
npm run tauri build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── stores/        # Zustand state management
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── App.tsx        # Main application component
├── App.css        # Global styles
└── main.tsx       # Application entry point

src-tauri/         # Tauri backend code
├── src/           # Rust source code
├── icons/         # Application icons
└── tauri.conf.json # Tauri configuration
```

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **Frontend**: React-based UI with TypeScript for type safety
- **State Management**: Zustand for lightweight, scalable state management
- **Backend**: Tauri for native desktop functionality and file system access
- **Styling**: Tailwind CSS for utility-first styling with Ant Design components
- **Canvas**: Fabric.js for interactive overlay editing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.