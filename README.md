# Droptimize Web App

Droptimize is a courier management system designed to make it easier for courier company admins, like J&T Express, to track and manage their employees.

This repository is dedicated to the development of the **Droptimize web application for administrators**. The web application provides a comprehensive dashboard for managing drivers, tracking parcels, monitoring deliveries, and analyzing performance metrics.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/current) (LTS version recommended)

## Setup Instructions

### Step 1: Install Dependencies

Open Terminal in the root directory (`Droptimize-Web/`) and run:

```bash
npm install
```

### Step 2: Start the Development Server

```bash
npm run dev
```

The application will start and be accessible at `http://localhost:5173` (or another port if 5173 is in use).

### Step 3: Build for Production (Optional)

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Technology Stack

This project is built with:

- **React** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **Firebase** - Backend services
- **Google Maps API** - Map integration
- **Tailwind CSS** - Utility-first CSS framework
