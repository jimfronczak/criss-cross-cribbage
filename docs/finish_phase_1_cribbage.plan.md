---
name: Finish Phase 1 Cribbage
overview: Complete Phase 1 of the Criss Cross Cribbage plan—scaffold the project, run the dev server, and confirm hot reload with a small edit—so you have a runnable "hello" app before starting Phase 2 (game data and cribbage scoring).
todos: []
isProject: false
---

# Finish Phase 1 Before Starting Phase 2

Phase 1 is defined in [criss_cross_cribbage_game_4ae3c82e.plan.md](C:\Users\fronczak.cursor\plans\criss_cross_cribbage_game_4ae3c82e.plan.md) as **"Project and 'hello' app"**: get a small web app running locally with Vite so the tooling and file layout are clear.

---

## Phase 1 steps (from the plan)


| Step | Action                                                                                                                                                    | Done when                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1    | **Create the project** – Use Vite to scaffold a vanilla JS (or React) project in a new folder.                                                            | You have `index.html`, `src/`, and a dev script (e.g. `npm run dev`). |
| 2    | **Run the dev server** – Run `npm run dev` and open the URL in the browser.                                                                               | You see the default Vite welcome page.                                |
| 3    | **Make a tiny change** – Edit your **entry file** (see “Complete Step 3” below) to change one line of text. Save and see the browser update (hot reload). | Edits in `src/` are reflected in the browser without a full refresh.  |


**Phase 1 is finished when:** The project exists, the dev server runs, and a small edit in the entry file hot-reloads in the browser. You then understand the entry point, dev server, and that `src/` drives what you see.

---

## Plan of action

1. **Choose project location**
  Decide the folder for the app (e.g. `C:\Users\fronczak\criss-cross-cribbage` or a subfolder under `Documents`). All Phase 1 work happens there.
2. **Complete Step 1 – Create the project**
  - In that folder, run: `npm create vite@latest . -- --template vanilla` (or `--template react` if you prefer React).  
  - If the folder is not empty, use a new subfolder: `npm create vite@latest criss-cross-cribbage -- --template vanilla` then `cd criss-cross-cribbage`.  
  - Run `npm install`.  
  - Confirm: `index.html`, `src/main.js` (or `src/main.jsx` for React), and `package.json` with a `"dev"` script exist.
3. **Complete Step 2 – Run the dev server**
  - Run `npm run dev`.  
  - Open the URL shown (e.g. `http://localhost:5173`) in the browser.  
  - Confirm the default Vite page appears.
4. **Complete Step 3 – Verify hot reload**
  - Find your **entry file**: open `index.html` and look at the `<script type="module" src="...">` tag. The `src` value (e.g. `/src/main.js`, `/src/main.jsx` for React, `/src/main.ts`, or `/src/App.jsx`) is your entry file. If you don’t have that file, create `src/main.js` and add a single line (e.g. `document.body.innerHTML = '<h1>Hello</h1>'`), and in `index.html` add: `<script type="module" src="/src/main.js"></script>` before `</body>`.
  - Edit that entry file: change one string or message.  
  - Save the file.  
  - Confirm the browser updates without a manual refresh.
5. **Definition of done for Phase 1**
  - Project is scaffolded with Vite.  
  - `npm run dev` runs and shows the Vite page.  
  - A small edit in the entry file triggers hot reload.  
   After that, Phase 1 is complete and you can start **Phase 2: Game data and cribbage scoring** (state, `scoreHand`, and tests).

---

## Optional: If you’ve already started Phase 1

- If the project already exists: do only the steps that aren’t done yet (e.g. if the project is created but you haven’t run the dev server, do steps 2 and 3).  
- If you’re unsure: run `npm run dev` in the project folder; if the Vite page loads and an edit in your entry file (see Step 3) hot-reloads, Phase 1 is complete.

No code or file changes are required beyond the one small edit in the entry file for Step 3. Once Phase 1 is done, we can proceed to Phase 2 (game data structures and `scoreHand` in `src/game/state.js` and `src/game/score.js`).