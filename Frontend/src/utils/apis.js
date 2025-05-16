import { getAccessToken } from "./utils";

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";


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

export const getSignedURL = async (filename, contentType) => {
    const response = await fetch(`${API_BASE_URL}/getSignedURL`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAccessToken()}`,
            },
            body: JSON.stringify({
                filename,
                contentType
            }),
        },
    );
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
        alert('Upload successful!');
        return true;
    } else {
        alert('Upload failed: ' + response.statusText);
        return false;
    }
}

export const getDisposableTopicToken = async () => {
    const response = await fetch(`${API_BASE_URL}/getDisposableToken/topic`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAccessToken()}`,
            },
        },
    );
    const { momentoToken } = await response.json();
    return momentoToken;
}