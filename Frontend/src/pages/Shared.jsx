import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  CredentialProvider,
  CacheClient,
  CacheDictionaryFetchResponse,
} from "@gomomento/sdk-web";
import useStore from '../store/store';
import Details from '../components/Details';

const CACHE_NAME = import.meta.env.VITE_SHARED_CACHE_NAME;

const Shared = () => {

  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const { id } = useParams();

  const { momentoDisposableToken } = useStore();



  useEffect(() => {

    const fetchData = async () => {
      const cacheClient = new CacheClient({
        credentialProvider: CredentialProvider.fromString({
          authToken: momentoDisposableToken
        }),
        defaultTtlSeconds: 86400, // 24 hours
      });

      const result = await cacheClient.dictionaryFetch(CACHE_NAME, id);
      console.log("🟢 Result:", result);

      switch (result.type) {
        case CacheDictionaryFetchResponse.Hit:
          console.log('Dictionary fetched successfully- ');
          result.valueMap().forEach((value, key) => {
            const parsedValue = JSON.parse(value);
            const parsedGPTResponse = JSON.parse(parsedValue.item.gptResponse);
            const { category, commonName, scientificName, info } = parsedGPTResponse;
            console.log("🟡 parsedValue", parsedValue.signedUrl);
            
            const signedUrl = parsedValue.signedUrl;
            setDetails({ category, commonName, scientificName, info, signedUrl });
          });
          break;
        case CacheDictionaryFetchResponse.Miss:
          console.log(`Dictionary 'test-dictionary' was not found in cache '`);
          break;
        case CacheDictionaryFetchResponse.Error:
          console.error(
            `An error occurred while attempting to call cacheDictionaryFetch on dictionary 'test-dictionary' in cache': ${result.errorCode()}: ${result.toString()}`
          );
          setError(
            `An error occurred while attempting to call cacheDictionaryFetch on dictionary 'test-dictionary' in cache': ${result.errorCode()}: ${result.toString()}`
          );
          throw new Error(
            `An error occurred while attempting to call cacheDictionaryFetch on dictionary 'test-dictionary' in cache': ${result.errorCode()}: ${result.toString()}`
          );

      }

    }

    console.log("🟡 momentoDisposableToken", momentoDisposableToken);

    if (momentoDisposableToken) fetchData();
  }, [id, momentoDisposableToken]);


  if (error) { return <div>Error</div> }

  if (!details) {
    return <div>Loading...</div>;
  }

  return <Details details={details} shared={true} />;
}

export default Shared