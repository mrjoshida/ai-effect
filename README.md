# The AI Effect — Philanthropy & Social Impact Edition

An interactive, web-based workshop companion and social card game adapted for philanthropy and social-impact teams. Participants explore how everyday and emerging uses of artificial intelligence **Support**, **Erode**, or **Depend on Context** when it comes to genuine human connection—and use **The Four Currents** framework to design team norms that protect human relationships as automation scales.

---

## Attribution & Source Credits

This project is an educational workshop adaptation built upon the research, frameworks, and creative work of **[The Rithm Project](https://www.therithmproject.org/)**:

1. **[The AI Effect Game](https://www.therithmproject.org/the-ai-effect)** — Created by **The Rithm Project** (featured in the *Sparks Toolkit*). *The AI Effect* is a discussion-based card game designed to move beyond binary rules or fear-based tech restrictions, helping communities evaluate whether specific AI scenarios **Support**, **Erode**, or **Depend on context** for human connection.
2. **[The Four Currents](https://aicurrents.therithmproject.org/)** (*"How to spot AI's invisible pull on your relationships"*) — Authored by **Alison Lee, PhD, Michelle Culver, and Rob Strain** (© 2026 The Rithm Project), with contributions from The Rithm Changemaker Network:
   - **[Current 01 — Our Sense of Trust](https://aicurrents.therithmproject.org/current-01/)**: When AI enters human communication, how it shifts our baseline trust in whether care and recognition are real.
   - **[Current 02 — Relationships with AI](https://aicurrents.therithmproject.org/current-02/)**: How turning to frictionless AI companions, coaches, and personas affects our appetite for messy, reciprocal human relationships.
   - **[Current 03 — Our Inner Voice](https://aicurrents.therithmproject.org/current-03/)**: What happens when we hand over our reflection, synthesis, and personal expression before wrestling with our own thoughts.
   - **[Current 04 — Acting for Us](https://aicurrents.therithmproject.org/current-04/)**: What happens when AI agents step in to represent, filter, or negotiate on our behalf in the relational world.

All credit for the core *Supports / Erodes / It Depends* game mechanic and *The Four Currents* taxonomy belongs to [The Rithm Project](https://www.therithmproject.org/).

---

## Features

- **20 Philanthropy & Social-Impact Scenarios**: Curated scenarios across four domains—**Working with Coworkers**, **Working with Grantees**, **Working with the Community**, and **General Life Experiences**—each paired with a **"What If?" Twist** and a **Rithm Current** mapping.
- **Centralized Presenter View**: Large editorial cards, inline SVG QR code and 4-character short code (`ABCD`) for instant room joining, live neutral river-pebble voting tray, animated response graphs, and Before → After vote shift deltas when a contextual twist is introduced.
- **Eyes-Up Mobile Participant View**: Zero-login mobile joining via QR code or short code, tactile thumb-friendly stance cards with plain-language subtitles, optional 1-line reflection notes, and live sync with the room.
- **The Four Currents Offsite Workshop Canvas**: Summarizes the room's shared convictions (*Green Zones*), guardrails (*Red Lines*), and richest tensions (*Gray Zones*) across Currents 01–04, with live facilitator norm capture and 1-click Markdown export.
- **100% Static & Zero-Backend**: Runs entirely on GitHub Pages using browser WebSocket pub/sub (`mqtt` over `wss://`) and `BroadcastChannel` for local multi-tab preview.

---

## Local Development

```bash
npm install --registry=https://registry.npmjs.org
npm run dev
```

### Verification Suite

```bash
npm run verify
```
Runs strict TypeScript checking (`tsc --noEmit`), the Vitest unit and privacy-guard test suite (`vitest run`), and the production static bundle build (`vite build`).
