# DevSnippets AI

A modern, offline-first developer utility mobile application built with Expo SDK 55, React Native, and TypeScript.

## 🚀 Features

### Core Functionality

- **Snippet Management** — Create, edit, delete, search, and favorite code snippets
- **Offline-First** — All data stored locally; works without internet
- **File Manager** — Browse, import, copy, move, and delete files
- **AI Explanations** — Get AI-powered explanations, summaries, and improvement suggestions
- **Export & Share** — Export snippets as `.txt`, `.js`/`.py`/etc., or `.json`

## 🗄️ Database Structure

SQLite database (`devsnippets.db`) with one primary table:

```sql
CREATE TABLE snippets (
  id          TEXT PRIMARY KEY NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  code        TEXT NOT NULL DEFAULT '',
  language    TEXT NOT NULL DEFAULT 'Other',
  tags        TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  description TEXT NOT NULL DEFAULT '',
  is_favorite INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
  file_path   TEXT,                         -- optional attached image URI
  created_at  TEXT NOT NULL,                -- ISO 8601 timestamp
  updated_at  TEXT NOT NULL                 -- ISO 8601 timestamp
);
```

Indexes: `idx_snippets_language`, `idx_snippets_is_favorite`, `idx_snippets_created_at`

## 📦 Offline Storage Approach

| Technology          | Usage                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **AsyncStorage**    | Theme preference (`light/dark/system`), font size, line numbers toggle, AI provider/model config |
| **SecureStore**     | AI API key (encrypted at rest, never stored in plain text)                                       |
| **SQLite**          | All snippet data — full CRUD with search, filtering by language and favorites                    |
| **Expo FileSystem** | Local file management, exported snippets, attached screenshots, templates                        |

All operations function completely offline. No network calls are made for core functionality — only the optional AI explanation feature requires internet access.

## 📁 File Management Implementation

Using the new **Expo FileSystem v55** class-based API (`File`, `Directory`, `Paths`):

```
Documents/
├── files/        ← User-managed files (importable via DocumentPicker)
├── attachments/  ← Screenshot attachments linked to snippets
├── exports/      ← Exported snippet files (.txt, .js, .json)
└── templates/    ← Downloaded code templates
```

- **Browse** directories with `dir.list()` → returns `File | Directory` instances
- **Import** files via `expo-document-picker` + `file.copy(destDir)`
- **Delete** with `file.delete()` or `dir.delete()`
- **Create folders** with `new Directory(parent, name).create()`
- **Attach images** via `expo-image-picker` → copied to `attachments/`

## 🏗️ Project Structure

```
DevSnippets/
├── app/
│   ├── _layout.tsx              # Root layout (ThemeProvider, FileSystem init)
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── index.tsx            # Home — snippet list + search + filters
│   │   ├── favorites.tsx        # Starred snippets
│   │   ├── files.tsx            # File manager
│   │   └── settings.tsx         # Theme, AI config, export all
│   └── snippet/
│       ├── create.tsx           # New snippet form
│       └── [id].tsx             # View/Edit/AI/Export snippet
├── db/
│   └── database.ts              # SQLite CRUD operations
├── services/
│   ├── aiService.ts             # AI API calls + SecureStore key management
│   ├── exportService.ts         # Snippet export (.txt/.code/.json)
│   └── fileService.ts           # File system operations
├── hooks/
│   ├── useSnippets.ts           # Snippet CRUD state hooks
│   └── useSettings.ts           # AsyncStorage settings hook
├── context/
│   └── ThemeContext.tsx          # Theme state + AsyncStorage persistence
├── components/
│   ├── SnippetCard.tsx          # Snippet list item
│   ├── CodeBlock.tsx            # Syntax-styled code viewer with copy
│   ├── SearchBar.tsx            # Search input
│   ├── TagInput.tsx             # Tag management input
│   ├── LanguagePicker.tsx       # Language selection modal
│   ├── EmptyState.tsx           # Empty list placeholder
│   └── AIExplanationModal.tsx   # AI result bottom sheet
├── constants/
│   ├── Colors.ts                # Light/Dark theme color palettes
│   └── Languages.ts             # Supported languages + colors + extensions
└── types/
    └── index.ts                 # TypeScript interfaces
```

## 🛠️ Tech Stack

- **Expo SDK 55**
- **React Native 0.83.6**
- **TypeScript**
- **expo-sqlite** — SQLite database
- **expo-secure-store** — Encrypted key storage
- **@react-native-async-storage/async-storage** — Preferences
- **expo-file-system** — File management (v55 class-based API)
- **expo-sharing** — Share exported files
- **expo-document-picker** — Import files
- **expo-image-picker** — Attach screenshots
- **expo-clipboard** — Copy code to clipboard
- **expo-router** — File-based navigation

## ▶️ Running the App

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.
