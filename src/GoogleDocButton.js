import React, { useEffect, useRef } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file";

function GoogleDocButton() {
  const tokenClient = useRef(null);
  const accessToken = useRef(null);

  useEffect(() => {
    function start() {
      gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://docs.googleapis.com/$discovery/rest?version=v1"],
      });
    }
    gapi.load("client", start);

    // Wait for GIS script to load
    const interval = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            accessToken.current = tokenResponse.access_token;
            gapi.client.setToken({ access_token: accessToken.current });
          },
        });
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCreateDoc = async () => {
    if (!accessToken.current) {
      if (tokenClient.current) {
        tokenClient.current.requestAccessToken();
      } else {
        alert("Google Identity Services not loaded yet. Please try again.");
      }
      return;
    }

    // Create a new Google Doc
    const response = await gapi.client.docs.documents.create({
      title: "Sample Google Doc from React",
    });

    const documentId = response.result.documentId;

    // Add sample content to the doc
    await gapi.client.docs.documents.batchUpdate({
      documentId,
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: "Hello from your React app! 🚀\nThis is a sample Google Doc created via the API.",
          },
        },
      ],
    });

    window.open(`https://docs.google.com/document/d/${documentId}/edit`, "_blank");
  };

  return (
    <div className="action-card" onClick={handleCreateDoc}>
      <div className="action-content">
        <div className="action-icon purple">
          <span role="img" aria-label="doc">📄</span>
        </div>
        <div className="action-text">
          <h4 className="action-title">Publish Sample Google Doc</h4>
          <p className="action-description">Create and publish a sample Google Doc</p>
        </div>
      </div>
    </div>
  );
}

export default GoogleDocButton;