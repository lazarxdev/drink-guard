# Drink Guard — Project Rules

## Auto-commit
After completing each task or iteration, automatically:
1. `git add` the changed files (not .env or secrets)
2. `git commit` with a clear, descriptive message
3. `git push` to origin main

Do this without being asked. Every change should be saved to GitHub.

## Tech Stack
- Expo SDK 54, React Native 0.81, TypeScript
- Supabase backend (anonymous auth, RLS policies)
- DeviceMotion API for tamper detection

## Important
- Never commit `.env` — it contains Supabase keys
- This is a personal project on the `lazarxdev` GitHub account
- Test changes via hot reload (Expo dev server running in another tab)
