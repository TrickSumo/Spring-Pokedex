import { createRoot } from 'react-dom/client'
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx';
import Home from './pages/Home.jsx';
import ScanDetails from './pages/ScanDetails.jsx';
import History from './pages/History.jsx';
import Shared from './pages/Shared.jsx';

const awsRegion = import.meta.env.VITE_AWS_REGION;
const congitoUserPoolID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const congitoUserPoolClientID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;

const cognitoAuthConfig = {
  authority: `https://cognito-idp.${awsRegion}.amazonaws.com/${congitoUserPoolID}`,
  client_id: congitoUserPoolClientID,
  redirect_uri: "http://localhost:5173/auth", //"https://staging.d223782eos6ban.amplifyapp.com/auth"
  response_type: "code",
  scope: "phone openid email",
};

createRoot(document.getElementById('root')).render(
  <AuthProvider {...cognitoAuthConfig}>
    <Router>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="scanDetails/:id?" element={<ScanDetails />} />
          <Route path="history" element={<History/>} />
           <Route path="shared/:id?" element={<Shared/>} />
        </Route>
      </Routes>
    </Router>
  </AuthProvider>
)
