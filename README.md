# Forethought

**Explore possible outcomes before making a decision.**

Forethought is a browser-based decision Support System that takes a user's decision, that they are stuck on, and generates an interactive branching tree of likely outcomes. It displays probability scores, impact levels, and projections ranging from one week to six months.

No sign-up. No backend. No data leaves your device. Everything runs directly in the browser.

## What it does

You enter a decision you are considering *e.g.,Should I go freelance or stay at my job?*, and Forethought creates an interactive tree showing possible paths, short-term effects, and how each choice may develop over the next six months.

The timeline slider allows you to explore how each decision changes over time. Moving from one week to six months updates the possible outcomes, probabilities, and insights as the situation develops.

The insight panel summarizes the main paths, showing their probability scores, impact levels, and observations related to the selected timeframe.

Every decision you explore is saved locally to your browser (nothing leaves your machine) and listed in the left-hand history panel next time you open the system. You can reload any previous tree, or clear your history whenever you want.

## How to use it

Open `index.html` using a modern browser such as Chrome, Firefox, Safari, or Edge. No build step, no dependencies to install, no server needed.

1. Type your decision in the main input field
2. Add optional context if it helps (e.g. "I have six months of savings")
3. Click **Explore outcomes** or press Ctrl+Enter
4. Move the timeline slider to explore how outcomes change over time
5. Pan the tree by clicking and dragging the canvas, scroll to zoom.

## File structure

Forethought/
├── index.html    Contains the page structure and markup
├── style.css     Contains styling, layout, and responsive rules
├── app.js        Contains tree generation, rendering, and interaction logic
└── README.md     This file

Everything is contained in these four files. There are no external JavaScript dependencies — not even a charting library. The tree is drawn with SVG, and the layout algorithm is a simplified version of the Reingold-Tilford approach for symmetric trees.

## How the decision engine works

Forethought does not use an AI model. Instead, it uses a rule-based decision engine that organizes possible outcomes based on the type of decision entered.

1. The system reads the user's decision and identifies the general category, such as career, finance, education, relationships, or lifestyle, using keywords.

2. Based on the detected category, it selects a suitable decision model containing possible paths, outcomes, and observations that match that type of decision.

3. Each path is given a probability score that changes across different time periods (1 week, 1 month, 3 months, and 6 months) to show how outcomes can develop over time.

4. The generated results are displayed as an interactive decision tree where users can explore different paths, compare possibilities, and reflect on the consequences of each choice.

Forethought is not designed to predict the future. It is a structured way of exploring possibilities and thinking through decisions before taking action.

## Notes

- History is stored in your browser's `localStorage` under the key `forethought_history`. Clearing your browser data will clear it.
- Ctrl+Enter submits a decision from the textarea without reaching for the mouse.
- The app works entirely offline after the initial load (Google Fonts is the only external resource — remove the font link in the `<head>` if you need full offline support and are happy with the system font stack).


## A note on scope

This is a portfolio-scale project, not a production planning tool — the "insights" are generated from simple rules, not real data or machine learning. The goal was to demonstrate front-end development skills, user interface design, and the implementation of interactive decision logic.