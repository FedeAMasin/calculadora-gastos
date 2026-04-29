# AGENTS.md

## Commands
- `npm run dev` - Start dev server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Stack
- React 19 + Vite 8 (no TypeScript)
- Supabase for backend (credentials in `.env.local`)

## Project Structure
- `src/App.jsx` - Main entry point
- All components in `src/*.jsx`

## Notes
- No test framework configured
- No pre-commit hooks
- Environment variables prefixed with `VITE_` for client-side access