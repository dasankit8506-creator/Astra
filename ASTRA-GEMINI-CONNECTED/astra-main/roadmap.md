# ASTRA Development Roadmap

## Implemented in this update
- Improved ASTRA AI preview greeting behaviour so ordinary greetings are not labelled as space questions.
- Added persistent multi-conversation chat history using browser IndexedDB.
- Added New Chat, automatic save, reopen, rename, delete and history search.
- Added reviewed preview answers for the Sun and Jupiter, alongside selected existing astronomy topics.
- Added dedicated Space Explorer cards for the Sun, Jupiter and Orion Nebula, with exact-title search prioritisation and quick topic detail panels.
- Added observation time to the SKY NOW planner and clarified that the planner currently stores choices only.
- Kept the existing cosmic visual identity and removed login/Supabase requirements.

## Not connected yet
- Live AI model and server-side AI endpoint.
- Real astronomical ephemeris calculations and object visibility.
- Weather, cloud cover and light-pollution data.
- Remote image analysis and astronomical verification for Point & Discover.
- Chat export/import backup and cross-device synchronisation.

## Next recommended work
1. Connect a real AI provider through a secure server-side endpoint; keep secrets out of frontend code and Git.
2. Integrate a reliable astronomy calculation source for selected location, date and time.
3. Add weather and light-pollution context with clear source and update timestamps.
4. Add consent-based image analysis and communicate uncertainty in object identification.
5. Add local data export/import for chat history and mission progress.
6. Run full dependency installation, lint, unit tests and production build before deployment.
