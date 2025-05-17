import React, { useEffect, useState } from 'react';
import './History.css';
import historyBG from '../assets/historyBG.png';
import { getScanHistory } from '../utils/apis';
import useStore from '../store/store';
import { useNavigate } from 'react-router-dom';

const domainName = import.meta.env.VITE_API_URL;

const History = () => {

    const [scanHistory, setScanHistory] = useState(null);
    const { setScannedDetails, clearNotifications } = useStore();
    const navigate = useNavigate();


    // Helper function to format date as "Month Day"
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    };

    useEffect(() => {
        const fetchScanHistory = async () => {
            const history = await getScanHistory();
            setScanHistory(history);
        };
        fetchScanHistory();
    }, []);

    const showDetails = (index) => {
        setScannedDetails(scanHistory[index]);
        clearNotifications();
        navigate('/scanDetails');
    };

    if (!scanHistory) {
        return <div className='loading'>Loading...</div>;
    }

    const parsedHistory = scanHistory.map(scan => ({
        ...scan,
        parsedGptResponse: (() => {
            try {
                return JSON.parse(scan.gptResponse);
            } catch {
                return {};
            }
        })()
    }));

    return (
        <>
            <div
                style={{ backgroundImage: `url(${historyBG})`, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}
                className='history-container'
            > </div>

            <div className='history-container'>

                <h1>My Discoveries</h1>

                <p>Your previous scans.</p>
                <div className='history-list'>
                    {console.log(parsedHistory)}
                    
                    {parsedHistory.map((scan, index) => (
                        <div key={scan.scanId} className='history-item' onClick={() => showDetails(index)}>
                            <h2>{scan?.parsedGptResponse?.category}</h2>
                            <img src={`${domainName}/${scan.scanId}`} alt={`Pokedex-history${scan.scanId}`} />
                            <h2>{scan?.parsedGptResponse?.commonName.slice(0,15)}</h2>
                            <p>{formatDate(scan.date)}</p>
                        </div>
                    ))}
                </div>
                {scanHistory.length === 0 && (
                    <div className='history-item'>
                        <p>No scan history available.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default History;
