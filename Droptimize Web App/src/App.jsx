import LandingPage from "./pages/LandingPage.jsx";
import RegistrationForm from "./pages/SignUp.jsx";
import LogInForm from "./pages/LogIn.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import Dashboard from "./pages/Dashboard.jsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LogInForm />} />
                <Route path="/signup" element={<RegistrationForm />} />
                {/*<Route path="/dashboard" element={<Dashboard />} />*/}
            </Routes>
        </Router>
    );
}

export default App;
