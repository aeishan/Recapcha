import React, { useEffect, useRef } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file";

function GoogleDocButton({ docData, buttonText = "📄 Open in Google Docs", style }) {
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

  // Helper to create a Google Doc with rich formatting from docData
  const createDoc = async () => {
    console.log('=== CREATE DOC CALLED ===');
    console.log('docData received:', docData);
    console.log('docData type:', typeof docData);
    console.log('docData is array:', Array.isArray(docData));

    // Validate docData
    if (!docData || !Array.isArray(docData) || docData.length === 0) {
      console.error('❌ Invalid docData provided to createDoc');
      alert('No document data available to create Google Doc');
      return;
    }

    if (!accessToken.current) {
      if (tokenClient.current) {
        tokenClient.current.requestAccessToken();
      } else {
        alert("Google Identity Services not loaded yet. Please try again.");
      }
      return;
    }

    try {
      console.log('✅ Creating Google Doc with valid docData');

      // Create a new Google Doc
      const response = await gapi.client.docs.documents.create({ 
        title: `Lecture Notes - ${new Date().toLocaleDateString()}` 
      });
      const documentId = response.result.documentId;

      // Always insert at the end of the document
      let currentIndex = 1;
      let requests = [];

      docData.forEach((section, idx) => {
        console.log(`Processing section ${idx}:`, section);
        
        // Validate section structure
        if (!section || !section.section || !section.content) {
          console.warn(`⚠️ Skipping invalid section at index ${idx}:`, section);
          return;
        }

        // Insert section header
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: section.section + "\n",
          },
        });
        
        // Heading style for section header
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: currentIndex, endIndex: currentIndex + section.section.length },
            paragraphStyle: { namedStyleType: "HEADING_2" },
            fields: "namedStyleType",
          },
        });
        currentIndex += section.section.length + 1; // +1 for newline

        // Insert section content (with **bold** support)
        let content = section.content + "\n\n";
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: content,
          },
        });

        // Find all **bold** ranges and add updateTextStyle requests
        let boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        let offset = 0;
        
        // Create a copy to work with for regex matching
        let contentCopy = content;
        
        while ((match = boldRegex.exec(contentCopy)) !== null) {
          const boldText = match[1];
          const matchStart = match.index;
          const start = currentIndex + matchStart - offset;
          const end = start + boldText.length;
          
          // Remove the ** from the text in the doc
          requests.push({
            deleteContentRange: {
              range: {
                startIndex: start,
                endIndex: start + 2,
              },
            },
          });
          requests.push({
            deleteContentRange: {
              range: {
                startIndex: end,
                endIndex: end + 2,
              },
            },
          });
          
          // Apply bold style
          requests.push({
            updateTextStyle: {
              range: { startIndex: start, endIndex: end },
              textStyle: { bold: true },
              fields: "bold",
            },
          });
          offset += 4; // Each ** is 2 chars, so 4 total
        }
        
        // Remove all ** for index calculation
        let plainContent = content.replace(/\*\*(.*?)\*\*/g, "$1");
        currentIndex += plainContent.length;
      });

      console.log('✅ Sending batch update to Google Docs');
      await gapi.client.docs.documents.batchUpdate({
        documentId,
        requests,
      });
      
      console.log('✅ Opening Google Doc in new tab');
      window.open(`https://docs.google.com/document/d/${documentId}/edit`, "_blank");
      
    } catch (error) {
      console.error('❌ Error creating Google Doc:', error);
      alert('Error creating Google Doc. Please try again.');
    }
  };

  return (
    <button 
      onClick={createDoc} 
      style={{
        background: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "background-color 0.2s ease",
        ...style
      }}
      onMouseEnter={(e) => {
        e.target.style.background = "#2563eb";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "#3b82f6";
      }}
    >
      {buttonText}
    </button>
  );
}

export default GoogleDocButton;