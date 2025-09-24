# Copilot Instructions for AI Agents

## Project Overview

This repository is a Node.js backend for the Capstone project by Mariano Leal & Steffi Ryser. The backend is structured for modularity and clarity, using Express and following conventions for scalable API development.

## Architecture & Key Files

- **BACKEND/src/index.js**: Entry point. Starts the Express server using configuration from `app.js`.
- **BACKEND/src/app.js**: Main Express app setup. Loads configuration, sets up routes, and exports the app instance.
- **BACKEND/src/config.js**: Loads environment variables using `dotenv`. Sets the port and other global config.
- **BACKEND/src/modulos/**: Contains feature modules. Example: `usuarios` for user-related routes.
- **BACKEND/src/modulos/usuarios/rutas.js**: Defines user API endpoints. Uses a shared response pattern via `red/respuestas.js`.
- **BACKEND/src/red/respuestas.js**: Centralizes API response formatting for success/error, ensuring consistent output.

## Developer Workflows

- **Start server (production):**
  ```cmd
  npm start
  ```
  Runs `node src/index.js`.
- **Start server (development, auto-reload):**
  ```cmd
  npm run dev
  ```
  Uses `nodemon` for hot-reloading.
- **Environment variables:**
  - Place a `.env` file in `BACKEND/` to override defaults (e.g., `PORT=4000`).

## Project-Specific Patterns

- **Modular Routing:**
  - Each feature (e.g., `usuarios`) has its own folder and `rutas.js` for endpoints.
  - Mount modules in `app.js` using `app.use('/api/feature', featureModule)`.
- **Centralized Responses:**
  - Use `red/respuestas.js` for all API responses. Always call `respuestas.success` or `respuestas.error` in route handlers.
- **Configuration:**
  - All config is loaded via `config.js` and environment variables.

## Integration Points

- **Express**: Main web framework.
- **dotenv**: For environment variable management.
- **nodemon**: For development auto-reload.

## Example: Adding a New Module

1. Create a folder in `src/modulos/` (e.g., `productos`).
2. Add a `rutas.js` file with Express routes.
3. Use `red/respuestas.js` for responses.
4. Mount in `app.js`:
   ```js
   const productos = require("./modulos/productos/rutas");
   app.use("/api/productos", productos);
   ```

## References

- See `README.md` for project context and links to documentation.
- All backend code is in `BACKEND/src/`.

---

**Feedback:** If any section is unclear or missing, please specify so it can be improved for future AI agents.
