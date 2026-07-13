# Exyconn Tools 🎨

A collection of powerful image editing and design tools for the Exyconn ecosystem.

- **UI**: https://tools.exyconn.com (Port: 4012)
- **API**: https://tools-api.exyconn.com (Port: 4013)
- **GitHub**: https://github.com/suryansh-business-work/exyconn-tools

All tools work offline and respect your privacy.

[![Type Check](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/typecheck.yml/badge.svg)](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/typecheck.yml)
[![Lint](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/lint.yml/badge.svg)](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/lint.yml)
[![Test](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/test.yml/badge.svg)](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/test.yml)
[![Build](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/build.yml/badge.svg)](https://github.com/suryansh-business-work/exyconn-tools/actions/workflows/build.yml)

## 🚀 Quick Start

### Install all dependencies
```bash
npm run install:all
```

### Run both UI and Server
```bash
npm run dev
```

This will start:
- **UI**: http://localhost:4012
- **Server**: http://localhost:4013

## 🧪 Testing

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
# UI tests
cd ui && npm run test:watch

# Server tests
cd server && npm run test:watch
```

### Run tests with coverage
```bash
# UI tests with coverage
cd ui && npm run test:coverage

# Server tests with coverage
cd server && npm run test:coverage
```

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment with **separate workflows** for each check:

### Workflow Files
| Workflow | File | Description |
|----------|------|-------------|
| 🔍 **Type Check** | `typecheck.yml` | TypeScript type validation for UI and Server |
| 🧹 **Lint** | `lint.yml` | ESLint code quality checks |
| 🧪 **Test** | `test.yml` | Vitest unit tests |
| 🏗️ **Build** | `build.yml` | Production build verification |
| 🚀 **Deploy** | `deploy.yml` | Deployment to production (main branch only) |

### Pull Request Checks
When you create a PR, all checks run in parallel:
- ✅ Type Check (UI + Server)
- ✅ Lint (UI + Server)
- ✅ Test (UI + Server)
- ✅ Build (UI + Server)

All checks must pass before merging.

### Deployment
After merging to `main`, the deploy workflow:
1. Builds both UI and Server
2. Deploys to production automatically

## 🐶 Git Hooks (Husky)

This project uses Husky for Git hooks to ensure code quality **before every commit**.

### Pre-commit Hook
Runs the following checks in sequence:
```bash
✔ npm run typecheck  # TypeScript validation
✔ npm run lint       # ESLint checks
✔ npm run test       # Unit tests
✔ npm run build      # Build verification
```

If any check fails, the commit is blocked.

### Pre-push Hook
Final verification before pushing.

### Setup Husky
```bash
# Install dependencies (includes husky setup)
npm install

# Or manually initialize husky
npx husky init
```

## ✨ Available Tools

### 🖼️ Logo Maker (Active)
Create professional logos, icons, favicons, and splash screens in multiple sizes.
- 📸 **Upload & Transform** - Upload any logo and apply transformations
- 🎨 **Multiple Size Variants** - Generate 25+ sizes for favicon, icons, logos, and splash screens
- ✂️ **Smart Cropping** - Per-size free-form cropping
- 🖌️ **Manual Eraser** - Fine-tune with eraser tool
- 🤖 **AI Background Removal** - Powered by Remove.bg & IMG.LY
- 📐 **Padding Control** - Adjust logo padding (0-40%)
- 🔄 **Transform Controls** - Scale, rotation, position, border-radius
- 💾 **Multiple Formats** - Export in PNG, JPG, WebP formats
- 🎯 **Per-Size Settings** - Customize each size individually
- ⬛ **Box Shadow** - Add shadows to icon sizes
- 🔆 **Image Adjustments** - Brightness, contrast, grayscale controls
- ↩️ **Undo/Redo** - History support for image changes
- ♿ **Contrast Warnings** - Accessibility warnings for low contrast
- 💾 **Auto-Save** - Progress saved to localStorage
- 🌓 **Light/Dark Theme** - UI theme toggle

### 🔜 Coming Soon
- **Image Resizer** - Resize images to any dimension
- **Image Compressor** - Compress without losing quality
- **Color Palette Generator** - Extract colors from images
- **Image Cropper** - Precision cropping with presets
- **Background Remover** - AI-powered background removal
- **Image Converter** - Convert between formats
- **Image Filters** - Instagram-style filters

## 🖼️ Logo Maker Size Variants

### Favicons (3 sizes)
`16×16` `32×32` `48×48`

### Icons (13 sizes)
`48×48` `64×64` `72×72` `96×96` `128×128` `144×144` `152×152` `192×192` `256×256` `384×384` `512×512` `1024×1024` `2048×2048`

### Logos (3 sizes)
`512×512` `1024×1024` `2048×2048`

### Splash Screens (6 sizes)
`640×1136` `750×1334` `1125×2436` `1242×2688` `1536×2048` `2048×2732`

## 🚀 Development Quick Start

### Install all dependencies
```bash
npm run install:all
```

### Run both UI and Server
```bash
npm run dev
```

This will start:
- **UI**: http://localhost:4012
- **Server**: http://localhost:4013

## Individual Commands

```
creative-tools/
├── ui/                          # React frontend (Vite + TypeScript + MUI)
│   └── src/
│       ├── tools/              # Individual tool modules
│       │   └── logo-maker/     # Logo Maker tool
│       │       ├── components/ # Tool-specific components
│       │       ├── hooks/      # Tool-specific hooks
│       │       └── types/      # Tool-specific types
│       ├── shared/             # Shared resources
│       │   ├── components/     # Shared UI components
│       │   ├── context/        # App-wide context (Theme)
│       │   └── styles/         # Global styles
│       └── pages/              # Route pages (ToolsPage)
├── server/                      # Node.js backend (Express + TypeScript)
│   └── src/
│       ├── tools/              # Tool-specific API routes
│       │   └── logo-maker/     # Logo Maker API routes
│       └── shared/             # Shared middleware
└── package.json                 # Root package for running both
```

## Individual Commands

### UI (React)
```bash
cd ui
npm install
npm run dev      # Start dev server on port 9000
npm run build    # Production build
```

### Server (Node.js)
```bash
cd server
npm install
npm run dev      # Start dev server on port 4013
npm run build    # Build TypeScript
npm run start    # Run production build
```

## 🔌 API Endpoints

### API Documentation
**GET** `/api`
- Returns list of available tools and their endpoints

### Logo Maker - Background Removal

**POST** `/api/tools/logo-maker/remove-background`
- Upload image file via multipart form data
- Returns: `{ success: true, image: "data:image/png;base64,..." }`

**POST** `/api/remove-background-base64`
- Uses IMG.LY local processing
- Body: `{ "image": "data:image/png;base64,..." }`
- Returns: `{ success: true, image: "data:image/png;base64,..." }`

**POST** `/api/remove-background-removebg`
- Uses Remove.bg API (requires API key)
- Body: `{ "image": "data:image/png;base64,...", "apiKey": "your-api-key" }`
- Returns: `{ success: true, image: "data:image/png;base64,..." }`

### Health Check

**GET** `/health`
- Returns: `{ status: "ok", service: "LogoSet Background Removal API" }`

## 🛠️ Tech Stack

### UI
- React 18 + TypeScript
- Vite
- Material UI (MUI)
- react-easy-crop

### Server
- Node.js + TypeScript
- Express
- @imgly/background-removal-node (AI background removal)
- Remove.bg API integration
- Multer (file uploads)

## 📝 License

MIT
