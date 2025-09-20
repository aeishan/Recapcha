# Recapcha

**Recapcha** is a full-stack web app that helps students convert their notes into quizzes for more effective studying. Write or upload your notes, and Recapcha will intelligently create quiz questions to test your memory and reinforce learning.


## Features

-  Save and manage plain text notes
-  Automatically generate quizzes based on notes
-  User authentication (Register / Login)
-  Associate quizzes with their original notes
-  Download `.txt` notes 
-  Built with MERN Stack (MongoDB, Express, React, Node.js)


## Tech Stack

| Layer        | Technology          |
|--------------|---------------------|
| Frontend     | React Native (Expo) |
| Backend      | Node.js + Express   |
| Database     | MongoDB + Mongoose  |
| Auth         | Custom Bearer Token |
| Language     | TypeScript & JavaScript |


## Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Expo CLI: `npm install -g expo-cli`

### Backend Setup

```bash
cd server
npm install
npm run dev
```

Create a `.env` file inside the `/server` folder:

```env
# API Keys
REACT_APP_OPENAI_API="your_openai_api_key_here"
REACT_APP_DEEPGRAM_API_KEY="your_deepgram_api_key_here"
REACT_APP_GOOGLE_API_KEY="your_google_api_key_here"
REACT_APP_GOOGLE_CLIENT_ID="your_google_client_id_here"

# Database
MONGODB_URI="your_mongodb_connection_string"

# Server
PORT=5050
```


---



---

## How It Works

1. **User creates a note** → Stored in backend and linked to user
2. **User generates a quiz** → Tied to the specific note
3. Both are stored and retrievable per user
4. Downloads available as `.txt` and `.json`

---

## Notes

- Notes and quizzes are embedded arrays in the User schema
- Quizzes reference notes via UUID (fastest for embedded schema)
- Authentication is simplified with user ID tokens

---

## Team

[@aeishan](https://github.com/aeishan)
[@1sakib](https://github.com/1sakib)
[@obeyad12](https://github.com/obeyad12)
[@MuhammadTaha457](https://github.com/MuhammadTaha457)

---

## 📃 License

This project is licensed under the [MIT License](LICENSE)
