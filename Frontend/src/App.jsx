import { useAuth } from "react-oidc-context";
import { Outlet } from "react-router-dom";
import Header from './components/Header';


function App() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "18ojho4vqn25edccu8ma5ko3bo";
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://us-east-1ty34xaazv.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated && !auth.isLoading) {
    auth.signinRedirect()
  }

  if (auth.isAuthenticated) {
    return (
      <>
        <Header />
        <main>
          <Outlet />
        </main>
      </>
    );
  }
}


export default App
