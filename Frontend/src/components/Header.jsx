import { useState, useEffect } from 'react';
import {
  TopicClient,
  TopicConfigurations,
  CredentialProvider,
} from "@gomomento/sdk-web";
import useStore from '../store/store';
import { getDisposableTopicToken } from "../utils/apis";
import './Header.css';
import { deleteAccessToken, getUserDetails } from '../utils/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "react-oidc-context";

const PUBSUB_CACHE_NAME = import.meta.env.VITE_PUBSUB_CACHE_NAME;
const congitoUserPoolClientID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const cognitoUserPoolDomain = import.meta.env.VITE_COGNITO_USER_POOL_DOMAIN;

function Header() {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [showNotificationDot, setShowNotificationDot] = useState(false);
  const [jiggle, setJiggle] = useState(false);
  const [render, setRender] = useState(false);

  const navigate = useNavigate();
  const auth = useAuth();

  const { notifications, addNotification, setStatus, setScannedDetails, setMomentoDisposableToken } = useStore();

  useEffect(() => {
    setShowNotificationDot(true);
    setJiggle(true);
    setTimeout(() => setJiggle(false), 3000);
  }, [notifications]);

  useEffect(() => {
    let subscription;
    const userSub = getUserDetails()?.sub;

    async function connectToTopic() {
      console.log("🟡 Connecting to topic...");

      const disposableTokenResponse = await getDisposableTopicToken();
      const authToken = disposableTokenResponse.authToken;

      setMomentoDisposableToken(disposableTokenResponse.authToken);

      const topicClient = new TopicClient({
        configuration: TopicConfigurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({
          authToken,
        }),
      });

      console.log("🟢 TopicClient created");

      try {
        subscription = await topicClient.subscribe(PUBSUB_CACHE_NAME, userSub, {
          onItem: (item) => {
            const value = item.valueString();
            console.log("🟢 New msg:", value);

            const parsedValue = JSON.parse(value);
            const { type } = parsedValue;
            if (type === "ProcessingSuccess") {
              const notificationMessage = `Creature Identified🌸 Click Here to view details➡️`;
              const notificationUrl = "/scanDetails"
              addNotification({ notificationMessage, notificationUrl });
              setStatus("ready");
              setScannedDetails(parsedValue);
              setIsDrawerVisible(true);
            }
            else if (type === "ProcessingFailure") {
              const notificationMessage = `Creature Identification Failed🥺`;
              addNotification({ notificationMessage });
              setStatus("error");
            }
          },
          onError: (err) => {
            console.error("🔴 Topic error:", err);
          },
          onCompleted: () => {
            console.log("🟡 Subscription ended");
          },
        });
        console.log("🟢 Subscribed successfully");
      } catch (err) {
        console.error("❌ Failed to subscribe:", err);
      }

      // Subscribe again before expiry
      const delayUntilExpiry = (disposableTokenResponse?.expiresAt?.validUntil * 1000) - Date.now();
      console.log("🟡 Delay until expiry:", delayUntilExpiry);
      delayUntilExpiry && setTimeout(() => {
        console.log("🟡 Re-subscribing...");
        setRender(!render);
      }, delayUntilExpiry - 3000);
    }

    connectToTopic();

    // Cleanup on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log("Unsubscribed from topic");
      }
    };
  }, [render]);

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
    setShowNotificationDot(false); // Hide the notification dot when clicked
  };

  const handleNotificationClick = (notification) => {
    if (notification.notificationUrl) {
      navigate(notification.notificationUrl);
    }
    setIsDrawerVisible(false); // Close the drawer
  };

  const signOutRedirect = () => {
    deleteAccessToken()
    const clientId = congitoUserPoolClientID;
    const logoutUri = window.location.origin;
    const cognitoDomain = cognitoUserPoolDomain;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <>
      <div className="header">
        <div className="home" onClick={() => navigate("/")}>🏠</div>
        <div className="home" onClick={signOutRedirect}>👋🏽</div>
        <div className={`notification ${jiggle && notifications.length > 0 ? 'jiggle' : ''}`}
          onClick={toggleDrawer}>
          🔔
          {showNotificationDot && notifications.length > 0 && <span className="notification-dot"></span>}
          {isDrawerVisible && (
            <div className="notification-drawer show">
              <div className='drawer-close-buutton'>x</div>
              <ul>
                {notifications.map((item, index) => (
                  <li key={index} onClick={() => handleNotificationClick(item)}>
                    {item.notificationMessage}
                  </li>
                ))}
              </ul>
              {notifications.length === 0 && (
                <div className="no-notifications">
                  No notifications yet!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Header;
