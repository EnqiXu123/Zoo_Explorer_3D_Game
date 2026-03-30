# Zoo_Explorer_3D_Game
Zoo Explorer 3D Game

🐘🦁 PRD – Zoo Explorer 3D (MVP1 – Enhanced)
1. 📌 Product Overview

Product Name: Zoo Explorer 3D
Type: Browser-based 3D educational experience

Description:
A simple 3D virtual zoo where children can explore a small environment, navigate using a mini map, interact with animals (Elephant + Lion), and learn one key fact about each animal through fun, prebuilt interactions.

2. 🎯 Problem Statement

Children:

lose interest in passive learning (books/videos)
need interactive and visual engagement
struggle to retain too many facts at once

Parents/educators:

want safe, simple, educational digital experiences
3. 🎯 Product Goals
Provide interactive learning through exploration
Teach one memorable fact per animal
Deliver a simple, intuitive experience across devices
Ensure engagement through rewards and discovery
4. 👧 Target User Persona

Emma (Age 8)

curious and playful
short attention span
prefers tapping over typing
learns through interaction and repetition
5. ✅ In Scope (MVP1)
Core Experience
1 small 3D zoo scene
2 animals: Elephant 🐘, Lion 🦁
player movement (desktop + mobile)
click/tap interaction
Learning Experience
prebuilt interaction buttons (no typing)
one key knowledge point per animal
short, kid-friendly responses
learning reward system
Navigation
mini zoo map (NEW)
player position indicator
animal location indicators
Progress Tracking
animals discovered counter
completion message
Multi-device Support
laptop (keyboard + mouse)
tablet (touch)
mobile (touch)
6. ❌ Out of Scope
voice interaction
free text AI chat
advanced animation
multiplayer
large/open-world zoo
backend/server
7. 🗺️ User Journey (Updated)
Start screen
Enter zoo
Explore using movement + map
Approach animal (visual + map cue)
Click/tap animal
Open interaction panel
Learn fact
Receive reward
Repeat for second animal
Completion message
8. 🧩 Core Screens & Build Details
🖥️ Screen 1: Start Screen
UI Components
Title: Zoo Explorer 3D
Subtitle: “Explore and learn about animals”
Button: Start Exploring
Behavior
click/tap → load game scene
🌿 Screen 2: 3D Zoo Exploration Screen (Main)
🎮 A. 3D Scene

Build:

ground plane (grass)
sky/background color
two animal zones:
Elephant (left side)
Lion (right side)
🚶 B. Player Movement
Desktop:
WASD or arrow keys
mouse to look around
Mobile/Tablet:
virtual joystick (or simple touch movement)
swipe to look
🐘🦁 C. Animals

Each animal:

visible 3D object/model
clickable/tappable
has ID (elephant / lion)
💡 D. Interaction Hint

When near animal:

floating text: “Tap/Click me”
🗺️ E. Mini Zoo Map (NEW – Critical Feature)
UI Placement
top-right corner
UI Elements
“You” indicator (dot)
🐘 Elephant icon
🦁 Lion icon
Behavior
player position updates dynamically
animal icons fixed
when near animal:
icon highlights (optional)
Visual Style
simple 2D layout
icon-based (no complex map)
bright and readable
📊 F. Progress Tracker
“Animals discovered: X / 2”
updates in real-time
💬 Screen 3: Animal Interaction Panel
Trigger
click/tap animal
UI Components
Header
🐘 Ellie the Elephant
🦁 Leo the Lion
Buttons (max 4)

Elephant:

Say Hello
What can you do with your trunk?
What do you eat?
Fun Fact

Lion:

Say Hello
Where do you live?
What is a pride?
Fun Fact
Response Area
short educational message
Close Button
returns to game
🎉 Screen 4: Learning Reward Popup
Trigger
first key interaction per animal
UI
“You learned something about [animal]!”
“Fact Unlocked!”
Behavior
auto-dismiss or tap to close
🏁 Screen 5: Completion Popup
Trigger
both animals discovered
UI
“You explored the zoo!”
“2 Animals discovered!”
9. ⚙️ Functional Requirements
FR-01: Start Game

GIVEN user on start screen
WHEN user clicks start
THEN load 3D scene

FR-02: Movement

GIVEN user in scene
WHEN input detected
THEN player moves

FR-03: Map Display

GIVEN game started
THEN map is visible

FR-04: Map Update

GIVEN player moves
THEN map position updates

FR-05: Animal Interaction

GIVEN user near animal
WHEN user taps/clicks
THEN interaction panel opens

FR-06: Interaction Response

GIVEN user clicks button
THEN predefined response shown

FR-07: Learning Trigger

GIVEN first meaningful interaction
THEN reward popup appears

FR-08: Progress Tracking

GIVEN animal learned
THEN update progress

FR-09: Completion

GIVEN all animals learned
THEN completion popup shown

10. 🧠 Data Model
animals = [
  {
    id: "elephant",
    name: "Ellie",
    learned: false,
    position: { x: -3, z: 0 },
    interactions: {...}
  },
  {
    id: "lion",
    name: "Leo",
    learned: false,
    position: { x: 3, z: 0 },
    interactions: {...}
  }
];

player = {
  position: { x: 0, z: 0 }
};
11. 🎮 Game States
START
EXPLORING
INTERACTING
POPUP
COMPLETED
12. 🧱 Component Structure
index.html
UI containers (map, panel, popup)
style.css
responsive layout
mobile-friendly sizing
script.js
Three.js setup
movement logic
raycasting
UI control
state management
13. 🏗️ Architecture
Three.js → rendering
HTML/CSS → UI overlays
JS → logic + state
JSON → data
14. 🧪 Non-Functional Requirements (NFR)
⚡ NFR-01: Performance
load ≤ 5 seconds
≥ 30 FPS
smooth interaction
📱 NFR-02: Multi-Device Compatibility (CRITICAL)

The system must work on:

laptop (keyboard + mouse)
tablet (touch)
mobile (touch)
🎮 NFR-03: Input Adaptability
desktop: keyboard + mouse
mobile: touch + tap
controls must feel intuitive on each device
🎨 NFR-04: Responsive UI
UI adapts to screen size
buttons large enough for touch
no overlap of key elements
🧠 NFR-05: Usability
user can start playing within 10–15 seconds
no tutorial required
👶 NFR-06: Kid-Friendly Design
simple language
short text
friendly tone
safe content
🔁 NFR-07: Reliability
no crashes
consistent interaction behavior
🔋 NFR-08: Efficiency
lightweight assets
low memory usage
no overheating on mobile
📶 NFR-09: Network Independence
no external APIs required
works after initial load
15. 📱 Multi-Device Experience Design
💻 Laptop
keyboard movement
mouse camera
click interaction
📱 Mobile / Tablet
touch movement (joystick or simplified)
tap interaction
swipe to look
🎯 Requirement

User must be able to:

explore
tap animal
interact
learn

on all devices

16. 🚀 Definition of Done

MVP1 is complete when:

user can enter zoo
movement works (desktop + mobile basic)
map is visible and updates
animals are clickable/tappable
interaction panel works
learning popup triggers
progress updates
completion message appears
