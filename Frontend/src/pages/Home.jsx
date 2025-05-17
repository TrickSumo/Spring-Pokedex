import { v4 as uuidv4 } from 'uuid';
import './Home.css';
import natureSmall from '../assets/natureSmall.png';
import natureBig from '../assets/natureBig.png';
import leaf from '../assets/leaf.png';
import flower from '../assets/flower.png';
import mushroom from '../assets/mushroom.png';
import useStore from '../store/store';
import { getSignedURL, uploadFile } from '../utils/apis';
import { useNavigate } from 'react-router-dom';

function Home() {

  const navigate = useNavigate();

  const { status, setStatus, addNotification } = useStore();

  const handleScan = () => {
    document.getElementById('hidden-file-input').click();
  }

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setStatus('uploading');
    try {
      const ext = selectedFile.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${ext}`;
      const preSignedUrl = await getSignedURL(uniqueFilename, selectedFile.type);
      const res = await uploadFile(selectedFile, preSignedUrl)
      if (res) {
        addNotification({ notificationMessage: `Add to queue ${selectedFile.name}`, notificationUrl: null });
        setStatus('processing');
      }
    } catch (err) {
      if (err.message === "limitExceeded") {
        addNotification({ notificationMessage: "Daily limit exceeded. Please try again tomorrow.", notificationUrl: null });
        setStatus('limitExceeded');
      }
      else {
        console.error('Upload error:', err);
        setStatus('error');
      }
    }
    finally {
      e.target.value = null;
    }

  }

  const getButtonText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading';
      case 'processing':
        return 'Processing';
      case 'error':
        return 'Try Again';
      case 'limitExceeded':
        return 'Max Limit Exceeded';
      default:
        return 'Scan Now';
    }
  }


  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className='hero-container'>
          <picture>
            <source media='(min-width: 768px)' srcSet={natureBig} />
            <img src={natureSmall} alt='Nature' />
          </picture>

          <div className='hero-text'>
            <h1>
              Discover <br /> Nature
            </h1>
            <p>One Scan at a Time.</p>
          </div>
        </div>

        <div className='content-section'>
          <div className='scan-section'>
            <input
              type='file'
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              id='hidden-file-input'
              onChange={handleUpload}
            />

            <button
              onClick={handleScan}
              disabled={status !== "ready" && status !== "error"}>
              {getButtonText()}
            </button>
          </div>
          <div className='history-section' onClick={() => navigate('/history')}>
            <p>Recent Discoveries</p>
            <div className='history-items'>
              <img src={leaf} alt='Leaf' />
              <img src={flower} alt='Flower' />
              <img src={mushroom} alt='Mushroom' />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
