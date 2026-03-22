# Droptimize Web Dashboard - Installation Guide 🖥️

The Droptimize **Web Dashboard** is the admin interface for managing drivers, parcels, and monitoring delivery operations.

> **📌 For complete setup instructions covering both mobile and web**, see the main **[INSTALLATION.md](../INSTALLATION.md)** in the parent `Droptimize` folder.

---

## Quick Start for Developers

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file (copy from `.env.example` if available):

```env
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=droptimize-4b6fc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=droptimize-4b6fc
VITE_FIREBASE_STORAGE_BUCKET=droptimize-4b6fc.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id_here
VITE_FIREBASE_APP_ID=your_id_here
```

### 3. Start Development Server

```bash
npm run dev
```

Open your browser and go to: `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

---

## Features

✅ **Driver Management** - View and manage all drivers
✅ **Delivery Tracking** - Real-time parcel status
✅ **Analytics** - Charts showing delivery volume, driver performance
✅ **Safety Monitoring** - Track overspeeding incidents
✅ **Map View** - Live map of all active drivers
✅ **Responsive Design** - Works on desktop and tablets

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard/        # Main dashboard charts
│   ├── Drivers/         # Driver management UI
│   ├── Parcels/         # Parcel tracking
│   ├── MapView/         # Live map display
│   ├── Modals/          # Dialog boxes
│   └── shared/          # Reusable components
├── pages/
│   ├── Dashboard.jsx    # Admin dashboard
│   ├── Drivers.jsx      # Drivers list
│   ├── MapView.jsx      # Live tracking
│   ├── Parcels.jsx      # Parcel management
│   └── LogIn.jsx        # Authentication
├── services.js          # API and Firebase calls
├── firebaseConfig.js    # Firebase setup
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

---

## Authentication

The dashboard uses Firebase Email/Password authentication.

- Default admin account setup through Firebase Console
- Users must have an account to access
- Passwords reset through email link

---

## Deployment

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI (one-time)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy --only hosting
```

### Deploy to Other Platforms

- **Vercel**: See `vercel.json` - push to GitHub to auto-deploy
- **Netlify**: Drag and drop the `dist/` folder
- **Any Node.js host**: Run `npm run build` and serve from `dist/`

---

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool (very fast)
- **Firebase** - Backend and authentication
- **Material-UI (MUI)** - Component library
- **Google Maps API** - Map display
- **Axios** - HTTP requests
- **TailwindCSS** - Styling

---

## Troubleshooting

**Port 5173 already in use**

```bash
# Use a different port
npm run dev -- --port 3000
```

**Module not found errors**

```bash
# Clean install dependencies
rm node_modules package-lock.json
npm install
```

**CORS errors**

- Check Firebase security rules allow your domain
- Verify API keys are set correctly

**Map not loading**

- Verify Google Maps API key in `.env.local`
- Ensure Maps API is enabled in Google Cloud Console

---

## Environment Variables

| Variable                    | Purpose                     | Required |
| --------------------------- | --------------------------- | -------- |
| `VITE_FIREBASE_API_KEY`     | Firebase API authentication | ✅ Yes   |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain        | ✅ Yes   |
| `VITE_FIREBASE_PROJECT_ID`  | Firebase project ID         | ✅ Yes   |
| All other VITE*FIREBASE*\*  | Firebase config             | ✅ Yes   |

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code quality
npm run preview      # Preview production build
```

---

## Browser Support

- ✅ Chrome (latest)
- ✅ Edge (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)

---

## Common Tasks

### Add a New Page

1. Create file in `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navigation.jsx`

### Connect to a New API

1. Add function in `src/services.js`
2. Call in your component with `useEffect` or `onClick`
3. Handle loading and error states

### Style a Component

- Use **TailwindCSS classes** for quick styling
- Or use **MUI components** for Material Design
- Keep custom CSS minimal

---

## Performance

- Lazy load components with `React.lazy()`
- Minimize bundle size by removing unused dependencies
- Use React DevTools Profiler to identify slow renders

---

## Security

- 🔒 API keys stored in `.env.local` (never commit)
- 🔒 Firebase security rules enforce access control
- 🔒 All API calls use HTTPS
- 🔒 User sessions stored in browser (cleared on logout)

---

## Getting Help

1. Check this README
2. See the `/INSTALLATION.md` for setup issues
3. Check Firebase docs: https://firebase.google.com/docs
4. Check React docs: https://react.dev
5. Contact your admin

---

**Ready to build?** Start with `npm run dev` 🚀
