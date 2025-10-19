# Neocity Web Prototype: Development Plan

**Version:** 1.0
**Date:** 2025-10-19

---

## 1. Vision & Goal

The primary goal is to develop a functional web-based prototype for **Neocity**. This prototype will serve as a proof-of-concept, focusing on the core mechanics of real-time social interaction, character control, and narrative gameplay as outlined in the GDD. It will lay the foundation for future features like mini-games and deep customization.

This plan moves beyond a simple point-and-click interface to a dynamic, real-time multiplayer experience.

---

## 2. Core Technologies

To achieve the real-time vision, we will use the following technologies:

*   **Frontend (Client):**
    *   **HTML5 `<canvas>`:** For rendering the game world, characters, and visual effects, allowing for smooth animation and direct control.
    *   **JavaScript (ES6+):** To run the client-side game logic, including the game loop, input handling, and rendering.
    *   **CSS3:** For styling the UI, overlays, and non-canvas elements to match the cybertech aesthetic.

*   **Backend (Server):**
    *   **Node.js:** A lightweight and efficient platform for running our server-side logic.
    *   **WebSockets (`ws` library):** To create a persistent, low-latency, two-way communication channel between the client and server, which is essential for real-time multiplayer.

---

## 3. Phased Development Plan

We will build the prototype in distinct phases, ensuring each step is functional before moving to the next.

### Phase 0: The Real-Time Foundation

**Objective:** Establish the fundamental client-server architecture for a real-time, shared environment.

**Key Tasks:**
1.  **Setup Server:** Create a `server.js` file using Node.js and the `ws` library to handle WebSocket connections and broadcast player data.
2.  **Update HTML:** Modify `index.html` to include a full-screen `<canvas>` element, which will act as our game window.
3.  **Implement Game Client:** Rewrite `app.js` to:
    *   Establish a WebSocket connection to the server.
    *   Create a **game loop** (`requestAnimationFrame`) to handle continuous updates and rendering.
    *   Implement keyboard input handling (WASD) for movement.
    *   Draw a basic shape (e.g., a circle) on the canvas to represent the player.
    *   Send the player's position to the server on every move.

**Expected Outcome:** A player can open the web page, "Enter The Grid," and move a shape around a blank canvas.

---

### Phase 1: Multiplayer Visualization

**Objective:** Allow players to see each other moving in the same space.

**Key Tasks:**
1.  **Server Logic:** The server will track the state of all connected players.
2.  **Client Logic:** The client (`app.js`) will:
    *   Receive broadcasted data for all players from the server.
    *   Store the state of all remote players.
    *   In the game loop, iterate through all players and draw a representative shape for each one at their current coordinates.

**Expected Outcome:** When multiple users open the app in different browser tabs, they can see each other's shapes moving in real-time.

---

### Phase 2: Narrative & World Interaction

**Objective:** Integrate the dialogue, choice, and cutscene systems into the real-time world.

**Key Tasks:**
1.  **Dialogue Engine:**
    *   Create a JSON-based structure to define conversations, character lines, and choices.
    *   Build a `DialogueManager` in `app.js` to parse and display this content.
2.  **Interaction System:**
    *   Place static "NPC" objects or interactive nodes within the world.
    *   Implement a proximity check: when a player moves close to an interactive node, a prompt appears (e.g., "Press 'E' to talk").
    *   Trigger the `DialogueManager` upon interaction.
3.  **UI Elements:** Design and implement HTML/CSS overlays for dialogue boxes, choice buttons, and character nameplates.

**Expected Outcome:** A player can walk their character up to an NPC, press a key to initiate a conversation, and make choices that affect the dialogue.

---

## 4. Future Phases (Post-Prototype)

Once the core prototype is complete, we can expand on the vision from the GDD.

*   **Phase 3: The "Echo" - Character Customization:**
    *   Develop a character customization screen.
    *   Replace the simple player shapes with layered 2D sprites (or simple 3D models) to represent modular body parts.

*   **Phase 4: The "Sim-Chambers" - Mini-Games:**
    *   Develop portals or access points in the main hub.
    *   Create a system to load different game states and rule sets for mini-games (e.g., Puzzle, Mystery, Racing, Card Game). This will allow for a wide variety of gameplay experiences.

*   **Phase 5: The "Syndicate" & Data-Dens:**
    *   Implement a basic chat system.
    *   Design a UI for the friend system.
    *   Begin work on instanced player housing.