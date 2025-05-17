import { useAuth } from "react-oidc-context";
import { Outlet } from "react-router-dom";
import Header from './components/Header';


function App() {
  const auth = useAuth();

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
