import { useEffect } from 'react';
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router";
import { getSignedCookie } from './utils/apis';



const Auth = () => {
    const { isAuthenticated, user } = useAuth();
    let navigate = useNavigate();
    useEffect(() => {
        const fetchIdentityId = async () => {
            const res = await getSignedCookie();
            navigate("/");
        }
        if (isAuthenticated) fetchIdentityId();
    })
    return (
        <div style={{ display: 'flex', width: '100vh', justifyContent: 'center', alignContent: 'center' }}>Authenticating...</div>
    )
}

export default Auth