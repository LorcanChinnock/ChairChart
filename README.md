# ChairChart

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An intuitive, client-side seating chart planner for weddings and events. Create, visualize, and share your seating arrangements with ease, all from your browser.

**[Live Demo (coming soon!)](#)**

![ChairChart Screenshot](https://via.placeholder.com/800x500.png?text=ChairChart+Application+Screenshot)

## About The Project

ChairChart solves a common problem for event planners: the difficulty of visualizing a seating arrangement from a spreadsheet. This tool provides a simple, visual, and interactive canvas to design layouts, manage guests, and see the big picture of your event.

Because it's a client-side-only application, all your data is stored privately in your browser's localStorage. There's no backend, no database, and no need for an account.

## Key Features

- **Visual Canvas**: Drag and drop tables (round, rectangular, or square) onto an infinite canvas.
- **Guest Management**: Easily add, edit, and group guests, tracking details like RSVP status and dietary needs.
- **Simple Seating Assignments**: Drag guests from a list and drop them directly onto seats.
- **Serverless & Private**: All data is stored securely in your browser's localStorage. No accounts, no cloud.
- **Easy Sharing**: Generate a unique URL to share a snapshot of your plan with vendors, planners, or family.
- **Static & Fast**: Built with Next.js and exported as a static site, making it fast and easy to deploy.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Canvas**: [Konva.js](https://konvajs.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- pnpm (or your preferred package manager)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/<your-username>/ChairChart.git
   ```
2. Navigate to the project directory
   ```sh
   cd ChairChart
   ```
3. Install packages
   ```sh
   pnpm install
   ```

## Development

To run the application in development mode with hot-reloading:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can start editing the page by modifying `src/app/page.tsx`.

## Build & Deployment

This project is configured for a static-only export, perfect for services like GitHub Pages.

1.  **Build the application:**
    ```bash
    pnpm build
    ```
    This command generates a static export of the application in the `/out` directory.

2.  **Test the build locally:**
    The standard `pnpm start` command will not work because this is not a server-based application. To serve the static files, run:
    ```bash
    cd out && python3 -m http.server 3000
    ```
    You can then view your production-ready site at `http://localhost:3000`.

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.
