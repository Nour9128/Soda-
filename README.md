# Soda+ — 3D Interactive Beverage Landing Page & Full-Stack App

A cinematic, 3D interactive landing page for **Soda+ (Pure Zero Refreshment)**. Built with high-performance vanilla JavaScript, Google `<model-viewer>`, GSAP animations, Web Audio procedural synthesis, and a lightweight Node.js/Express backend.

---

## ✨ Features

- **Interactive 3D Can**: Real-time 3D model viewer with interactive orbit physics, auto-rotate 360° mode, view reset, and dynamic GLTF texture swaps between flavors.
- **Physics-Based Floating Berries & Leaves**: Micro-gravity floating animation with mouse repulsion physics.
- **Procedural Web Audio Synthesizer**: Realistic can-opening crack ("PSSSH!"), fizzy effervescence, bubble pops, and glass chime feedback with zero external audio assets.
- **Full Slide-Over Shopping Cart**:
  - Add/remove items with animated quantity steppers
  - Dynamic free shipping progress indicator ($15 threshold)
  - Promo coupon code validation (`REFRESH20`, `SODA20`, `ZERO` for 20% off)
  - Multi-step checkout simulation with Credit Card, Apple Pay, and Cash on Delivery
- **Dynamic Modals**:
  - **Nutrition & Ingredients**: Side-by-side nutritional facts and botanicals breakdown
  - **Our Story**: Craft micro-carbonation process and purity statistics
  - **Zero Footprint Pledge**: Live eco impact counters (trees planted, bottles diverted, CO2 saved)
  - **Customer Reviews**: Real-time verified reviews feed with interactive review submission
  - **Contact Concierge**: Support ticket submission form
- **RESTful Node.js Backend**:
  - `GET /api/config` — Model assets, flavors, story, and eco metrics
  - `GET /api/reviews` & `POST /api/reviews` — Persistent review storage
  - `POST /api/contact` — Customer messaging with ticket tracking
  - `POST /api/checkout` — Order processing, discount calculation, and order tracking
  - `POST /api/newsletter` — Discount subscription

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation & Run

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Nour9128/soda-plus.git
   cd soda-plus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser at:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), Vanilla ES6+ JavaScript
- **3D & Animation**: [Google `<model-viewer>`](https://modelviewer.dev/), [GSAP (GreenSock)](https://greensock.com/gsap/)
- **Audio**: Web Audio API (Procedural sound synthesis)
- **Backend**: Node.js, Express.js
- **Persistence**: File-based JSON store in `/data`
