import { getAccessToken } from "./utils";

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

const createHeaders = () => {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
    };
}


export const getSignedCookie = async (id) => {
    const response = await fetch(`${API_BASE_URL}/getSignedCookie`,
        {
            method: "GET",
            headers: createHeaders(),
            credentials: 'include'
        },
    );
    return response.json();
};

export const getSignedURL = async (filename, contentType) => {
    const response = await fetch(`${API_BASE_URL}/getSignedURL`,
        {
            method: "POST",
            headers: createHeaders(),
            body: JSON.stringify({
                filename,
                contentType
            }),
        },
    );
    
    if (response.status === 429) {
        throw new Error("limitExceeded");
    }
    if (!response.ok) {
        throw new Error("Failed to get signed URL");
    }
    const { url: presignedUrl } = await response.json();
    return presignedUrl;
};

export const uploadFile = async (file, presignedUrl) => {
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    });

    if (response.ok) {
        return true;
    } else {
        return false;
    }
}

export const getDisposableTopicToken = async () => {
    const response = await fetch(`${API_BASE_URL}/getDisposableToken`,
        {
            method: "GET",
            headers: createHeaders(),
        },
    );
    const momentoToken  = await response.json();
    return momentoToken;
}

export const getScanHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/getScanHistory`,
        {
            method: "GET",
            headers: createHeaders(),
        },
    );
    const { Items } = await response.json();
    return Items;
}

export const shareScan = async (key) => {
    const response = await fetch(`${API_BASE_URL}/shareScan`,
        {
            method: "POST",
            headers: createHeaders(),
            body: JSON.stringify({
                scanId: key
            }),
        },
    );
    const data = await response.json();
    return data;
}