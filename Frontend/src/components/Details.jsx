import React, { useState } from 'react';
import './Details.css'; // Import the CSS for styling
import detailsBG from '../assets/detailsBG.png'; // Import the background image
import mushroom from '../assets/mushroom.png';
import leafRight from '../assets/leafRight.png';
import { shareScan } from '../utils/apis';

const domainName = import.meta.env.VITE_API_URL;

function Details({ details, shared }) {

  const { category, commonName, scientificName, info, key, signedUrl } = details;

  const [shareUrl, setShareUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Fallback image handler
  const handleImgError = (e) => {
    e.target.onerror = null;
    e.target.src = mushroom; // fallback image
  };

  const handleShareButtonClick = async () => {
    setIsLoading(true);
    const shareDetails = await shareScan(key);
    setIsLoading(false);
    if (!shareDetails) { alert("Failed to share scan!"); return; }
    setShareUrl(window.location.origin + "/shared/" + shareDetails.shareId);
  }

  return (
    <>
      <div
        style={{ backgroundImage: `url(${detailsBG})` }}
        className='details-container'
      >
        <img src={leafRight} alt='leaf' className='leaf-image' />

        <div className='content'>
          <h1 className='type'>{category} Details</h1>
          <h2 className='local-name'>{commonName}</h2>
          <h3 className='scientific-name'>{scientificName}</h3>

          <div className='scan-details'>
            <img
              src={shared ? signedUrl : `${domainName}/${key}`}
              alt='Pokedex-image'
              onError={handleImgError}
            />
            <div className='scan-description'>{info}</div>
          </div>

          {
            !shared && <div className="share-scan">
              {
                shareUrl ? (
                  <button className="copy-button" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy Share URL'}
                  </button>
                ) :
                  <button className='share-button' onClick={handleShareButtonClick}>{isLoading ? 'Loading...' : 'Share'}</button>
              }
            </div>
          }
        </div>
      </div>
    </>
  );
}

export default Details;
