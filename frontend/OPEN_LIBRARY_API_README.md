# OpenLibrary API Integration — PagePulse

This guide explains how to set up and test the `openLibraryApi.ts` file in your Vue frontend.

---

## Prerequisites

### 1. Install Node.js
If you don't have Node.js installed:
1. Go to **https://nodejs.org**
2. Download the **LTS** version (left button)
3. Run the installer and click Next through everything — keep all defaults
4. Close and reopen your terminal after it finishes

Verify it installed correctly:
```bash
node --version
npm --version
```
Both should print a version number.

### 2. Fix PowerShell Execution Policy (Windows only)
If you get a script security error when running npm, run this once in PowerShell:
```bash
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Press **Y** then Enter to confirm.

---

## Project Setup

### 1. Navigate to your frontend folder
```bash
cd C:\Users\fadee\page_pulse\frontend
```

### 2. Install dependencies
Run this once — it downloads all required packages. This can take **3-5 minutes** on first run (Cypress is large).
```bash
npm install
```
You'll see a spinning `/|\-` animation while it works. It's done when you see:
```
added 594 packages in Xm
```

---

## File Placement

Make sure `openLibraryApi.ts` is placed at:
```
frontend/
  src/
    openLibraryApi.ts   ← the API file
    App.vue
    main.ts
```

---

## Testing the API

### 1. Set up App.vue for testing
Replace the contents of `src/App.vue` with this temporary test code:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { openLibraryApi, toBook } from '@/openLibraryApi'

onMounted(async () => {
  // Test search
  const results = await openLibraryApi.search('dune', { field: 'title' })
  const books = results.docs.map(toBook)
  console.log('Search results:', books)

  // Test single work
  const work = await openLibraryApi.getWork('OL45804W')
  console.log('Work detail:', work)
})
</script>

<template>
  <p>Check the browser console for API results.</p>
</template>
```

> **Important:** Make sure there is only one `<template>` block. Do not leave any commented-out `<template>` tags at the top of the file — Vue will throw an error.

### 2. Start the dev server
```bash
npm run dev
```
You should see:
```
  VITE v6.x.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
```

### 3. Open the app in your browser
Go to:
```
http://localhost:5173
```
You should see: **"Check the browser console for API results."**

### 4. Open DevTools on the app tab
Make sure you are on the `http://localhost:5173` tab, then:
1. Press **F12**
2. Click the **Console** tab

---

## What You Should See in the Console

### Search results — an array of 20 books:
```js
Search results: [
  { id: 'OL818506W', isbn: '9780441013593', title: 'Dune', description: null },
  { id: 'OL103003W', isbn: '9780441172719', title: 'Dune Messiah', description: null },
  // ...18 more
]
```

### Work detail — full data for a specific book:
```js
Work detail: {
  key: '/works/OL45804W',
  title: 'Fantastic Mr. Fox',
  description: 'The main character of this book...',
  subjects: ['Animals', 'Foxes', 'Fiction', ...],
  covers: [12345, ...],
  authors: [{ author: { key: '/authors/OL34184A' } }],
  first_publish_date: '1970'
}
```

### Things to verify:
- No red errors in the console
- `Search results` shows an array of book objects
- `isbn` may be `null` on some books — this is normal, not all books have one indexed
- `description` in search results is always `null` — it requires a separate `getWork()` call
- `Work detail` has a real description string

---

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `npm not recognized` | Node.js not installed | Install from nodejs.org |
| `cannot be loaded, not digitally signed` | PowerShell policy | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `Could not read package.json` | Wrong directory | Make sure you `cd` into the `frontend` folder |
| `vite not recognized` | Dependencies not installed | Run `npm install` first |
| `Single file component can only have one <template>` | Duplicate template in App.vue | Remove any commented-out `<template>` tags |
| Grammarly/Intercom errors in console | Browser extensions | Ignore — not related to your code |

---

## Available API Methods

```ts
// Search books (field: 'q' | 'title' | 'author' | 'subject' | 'isbn')
openLibraryApi.search('dune', { field: 'title', page: 1, limit: 20 })

// Get full details for a specific book
openLibraryApi.getWork('OL45804W')

// Get author profile
openLibraryApi.getAuthor('OL1394244A')

// Get books by subject
openLibraryApi.getSubject('science_fiction', 12)

// Get cover image URL
openLibraryApi.covers.byId(12345, 'M')       // S | M | L
openLibraryApi.covers.byIsbn('9780441013593', 'L')

// Transform a search result into your frontend schema
toBook(doc) // → { id, isbn, title, description }
```

---

## Notes

- The API talks directly to **https://openlibrary.org** — no API key required
- All requests use the native browser `fetch` — no extra packages needed
- Open Library is CORS-friendly so no proxy is needed for local development
- `description` is only available via `getWork()`, not in search results
