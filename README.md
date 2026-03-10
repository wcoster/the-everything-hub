# 🏑 Vermogenplanner

A personal wealth planning tool built for long-term financial clarity. Entirely vibe coded with [Claude](https://claude.ai).

![HTML](https://img.shields.io/badge/HTML-Single%20File-orange) ![Vibe Coded](https://img.shields.io/badge/Vibe-Coded%20%F0%9F%8E%B6-blueviolet) ![Dutch](https://img.shields.io/badge/Language-Dutch%20%F0%9F%87%B3%F0%9F%87%B1-blue)

## What is this?

A single-page, zero-dependency wealth strategy visualizer that projects your net worth over 1–30 years. It models savings accounts, deposit accounts, and debt repayment (DUO student loans), then charts everything in real time as you tweak the numbers.

The UI is in Dutch because it was built for a specific person — but the math is universal.

## Features

- **Multi-year projection** — choose anywhere from 1 to 30 years via dropdown
- **Tiered interest rates** — models Revolut-style accounts where the first €X earns a different rate than the rest
- **Debt snowball** — once debt is paid off, the monthly repayment automatically redirects to savings
- **Annual income raise** — compound growth on all contributions (makes the 30-year view actually exciting)
- **Budget allocation pie chart** — see where your money goes at a glance, with a remaining/shortfall indicator
- **Brute-force optimizer** — finds the mathematically optimal split of your monthly budget across all accounts to maximize end wealth, complete with confetti
- **"Apply to plan" button** — smoothly animates your inputs to the optimal values
- **Fully responsive** — works on desktop, tablet, and phone with four breakpoints down to 380px
- **Glassmorphism design** — dark green hockey pitch background with floating balls, glow blobs, and frosted glass cards

## Tech Stack

This is a single HTML file. That's it. No build step, no framework, no node_modules.

- **Chart.js** — for the line chart and doughnut chart (loaded via CDN)
- **Google Fonts** — Outfit + DM Sans
- **Vanilla JS** — all simulation, optimization, and animation logic
- **CSS** — glassmorphism, responsive grid, custom select styling, confetti canvas

## Usage

Open `vermogenplanner.html` in a browser. Done.

Or serve it however you like — it's one file with no external dependencies beyond two CDN links.

## How the Optimizer Works

The "Bereken beste strategie" button runs a brute-force search over all possible monthly allocation splits (in €10–€50 steps depending on budget size). For each combination of savings / deposit / debt repayment that sums to your total available income, it simulates the full projection period including compound interest, tiered rates, debt payoff redirection, and annual raises. The split that produces the highest net worth wins.

It's not gradient descent. It's not linear programming. It's a nested for-loop with confetti. And it works.

## Vibe Coded

This entire project was vibe coded in a conversation with Claude. No code was written by hand. The process went roughly like:

1. Started with a rough HTML prototype
2. "Make it glassmorphism with a field hockey theme"
3. "The debt display shows 'never', fix that"
4. "Split the interest into tiers"
5. "Add a button that finds the optimal strategy — make it fun"
6. "Add a pie chart for budget allocation"
7. "Let me pick the number of years"
8. "Add annual income raises"
9. "Make it responsive"

Each iteration was built on top of the last. No refactors, no rewrites, just vibes.

## License

Do whatever you want with it. It's a single HTML file that was vibe coded at midnight.
