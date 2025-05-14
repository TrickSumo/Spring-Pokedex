const API_BASE_URL = import.meta.env.VITE_API_URL

const getAccessToken = () => {
    const sessionStoragKeys = Object.keys(sessionStorage);
    const oidcKey = sessionStoragKeys.find(key => key.startsWith("oidc.user:https://cognito-idp."));
    const oidcContext = JSON.parse(sessionStorage.getItem(oidcKey) || "{}");
    const accessToken = oidcContext?.access_token;
    return accessToken;
};

export const deleteAccessToken = () => {
    const sessionStoragKeys = Object.keys(sessionStorage);
    const oidcKey = sessionStoragKeys.find(key => key.startsWith("oidc.user:https://cognito-idp."));
    sessionStorage.removeItem(oidcKey);
}

export const fetchCoffees = async () => {
    // alert(`API_BASE_URL: ${API_BASE_URL}`)
    const response = await fetch(`${API_BASE_URL}/coffee`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
        },
    });
    return response.json();
};

export const getSignedCookie = async (id) => {
    const response = await fetch(`${API_BASE_URL}/getSignedCookie`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAccessToken()}`,
            },
            credentials: 'include'
        },
    );
    return response.json();
};