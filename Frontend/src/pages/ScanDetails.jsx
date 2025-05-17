import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useStore from '../store/store';
import Details from '../components/Details';

const ScanDetails = () => {

  const { scannedDetails } = useStore();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (scannedDetails?.gptResponse) {
      const data = JSON.parse(scannedDetails.gptResponse);
      console.log("🟡 data", scannedDetails);

      data.key = scannedDetails.key || scannedDetails.scanId;
      setDetails(data);
    }
    else {
      navigate('/history');
    }

  }, [scannedDetails]);

  return (
    details ? <Details details={details} /> : <div className='loading'>Loading...</div>
  )
}

export default ScanDetails