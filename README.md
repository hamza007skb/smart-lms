 Academica LMS & AI Engine

Academica is a modern, full-stack Learning Management System (LMS) built for educators and students. It features course management, assignment submissions, and a custom integrated Python AI engine that scans student uploads for plagiarism and similarity using TF-IDF.

System Architecture
This project is divided into two main environments:
1. **Frontend:** React.js (Vite) - *Runs on Port 5173*
2. **Backend:** Node.js API with an integrated Python (FastAPI) AI Engine.


 Repository Structure
```text
academica-lms/
├── frontend/          # React UI & Context Providers
├── backend/           # Node.js API & MongoDB Models
│   ├── ai-engine/     # Python FastAPI & Plagiarism logic
│   ├── controllers/   # Route logic & Business rules
│   └── models/        # MongoDB Schemas
├── .gitignore         # Master Git ignore rules
└── README.md          # You are here!
 Quick Start Guide
Prerequisites
Before you begin, ensure you have the following installed on your machine:

Node.js (v18 or higher)

Python (v3.10 or higher)

MongoDB (Local instance or Atlas Cluster)

Step 1: Start the Backend & AI Engine
Because the Node.js API relies on the Python engine to score submissions, we must start both services inside the backend folder.

1A. Start the AI Engine (Python):

Open a terminal and navigate to the integrated AI folder:

Bash
cd backend/ai-engine
Create and activate a virtual environment:

Bash
# Windows
python -m venv env
.\env\Scripts\activate

# Mac/Linux
python3 -m venv env
source env/bin/activate
Install dependencies and start the FastAPI server:

Bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
The AI Engine is now listening on http://localhost:8000

1B. Start the Node.js API:

Open a new terminal window and navigate to the root of the backend folder:

Bash
cd backend
Install dependencies:

Bash
npm install
Environment Setup:
Create a .env file in the backend folder and add your specific keys:

Plaintext
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
Start the Express server:

Bash
npm run dev
The Backend API is now connected to MongoDB and listening on http://localhost:5000

Step 2: Start the Frontend (React)
Open a third terminal window and navigate to the frontend folder:

Bash
cd frontend
Install dependencies:

Bash
npm install
Start the Vite development server:

Bash
npm run dev
The Frontend is now live on http://localhost:5173

🧪 Testing the Application
To quickly explore the application without creating a new account, use these default test credentials:

Teacher Account:

Email: teacher@academica.edu

Password: password123

Student Account:

Email: student@academica.edu

Password: password123