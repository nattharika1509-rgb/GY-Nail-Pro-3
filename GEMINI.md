# Project Overview

This directory contains the source code for **GY-Nail Pro 3**, a comprehensive online booking system for a nail salon.

The project is built using **Google Apps Script** for the backend logic and a **vanilla HTML/JavaScript frontend styled with Tailwind CSS**. It uses **Google Sheets** as its database for storing information about bookings, services, staff, and customer reviews.

The secondary `skills1` directory appears to hold configuration and skill definitions for various AI agent frameworks, but the main application is `gas-data-sync`.

## Key Technologies

-   **Backend**: Google Apps Script (`Code.js`)
-   **Frontend**: HTML, Vanilla JavaScript, Tailwind CSS (`index.html`)
-   **Database**: Google Sheets
-   **Deployment**: Google Apps Script Web App, managed with `clasp`.
-   **Integrations**: Google Calendar (for appointments), Google Drive (for image galleries), Gemini API (for an AI assistant).

## Building and Running

This project uses `@google/clasp` to manage development and deployment from the command line.

### Prerequisite

Install and authenticate `clasp` globally:

```bash
npm install -g @google/clasp
clasp login
```

### Key Commands

The following commands are defined in `gas-data-sync/package.json`:

-   **`npm run push`**: Uploads the local code from the `gas-data-sync/src` directory to the linked Google Apps Script project.
-   **`npm run pull`**: Downloads the code from the Google Apps Script project to the local `gas-data-sync/src` directory.
-   **`npm run deploy`**: Deploys the script as a web app.
-   **`npm run open`**: Opens the Google Apps Script project in a web browser.

### Setup

1.  Navigate to the `gas-data-sync` directory.
2.  Install dependencies: `npm install`.
3.  Set up a Google Sheet with the required tabs (`Bookings`, `Staffs`, `Services`, `Settings`, `Reviews`).
4.  Update the `SHEET_ID`, `CALENDAR_ID`, and `GEMINI_API_KEY` constants in `gas-data-sync/src/Code.js`.
5.  Push the code using `npm run push`.
6.  Create a deployment using `npm run deploy`.

## Development Conventions

-   All backend logic is contained within `gas-data-sync/src/Code.js`.
-   The main user interface is in `gas-data-sync/src/index.html`.
-   Project configuration (Sheet IDs, API keys) is managed in the `CONFIG` object at the top of `Code.js`.
-   The application communicates between frontend and backend via `doGet` and `doPost` functions, which act as an API router.
-   The system is designed to automatically create necessary sheets and headers if they don't exist upon first run.
