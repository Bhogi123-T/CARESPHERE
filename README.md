# 🚑 CareSphere: EHS Healthcare & Emergency Platform

CareSphere is a comprehensive, AI-powered healthcare and emergency response platform designed specifically to bridge the gap between rural patients and modern medical infrastructure. 

Our core mission is to ensure that **no emergency goes unnoticed**, even in areas with zero internet connectivity.

---

## ✨ Key Features

### 📡 Zero-Internet Rural SOS (Offline First)
- **SMS Payload Generation:** When a user loses internet, the app automatically compresses critical data (GPS coordinates, battery %, blood group, and emergency code) into a tiny payload (`SOS001|13.048|80.141|H01|O+|84|1432`).
- **2G Fallback:** Routes the emergency payload via the native SMS intent to emergency services (108) and family contacts using basic cellular voice networks.
- **Low Battery Failsafe:** Proactively monitors battery percentage and prompts users to trigger an SOS before their device dies.

### 🛠️ Offline Lifesaver Toolkit
- **Flashlight (Torch):** In-browser control of the device flashlight to signal for help.
- **Loud Siren:** Triggers a looping, high-decibel alarm from the device to attract nearby villagers.
- **Offline First Aid:** Instant access to crucial first-aid protocols (CPR, Snake Bites, Heavy Bleeding) without needing an active data connection.

### 🎙️ Multi-lingual Voice Recognition
- Voice-activated SOS symptom recording supporting multiple rural dialects (English, Telugu, Tamil, Hindi) so patients can dictate their emergency naturally.

### 🧠 AI-Powered Health Assistant
- **Symptom Analysis:** A machine learning backend that evaluates reported symptoms to assign a risk level (Critical, Moderate, Low).
- **Smart Routing:** Directs ambulances dynamically using DQN-based routing algorithms.

### 🏥 Complete Healthcare Ecosystem
- **Patient Dashboard:** Live tracking, medicine reminders, and health timelines.
- **Hospital/Pharmacy Dashboards:** Manage incoming emergencies, bed availability, and real-time medicine stock.
- **Tele-Consultation:** Connect directly with ASHA workers and doctors via video/audio.

---

## 💻 Technology Stack
- **Frontend:** React.js (Vite), Tailwind CSS, Framer Motion, Leaflet (Maps)
- **Backend:** Python, Flask, Socket.IO
- **Machine Learning:** Scikit-Learn, Custom DQN Routing Models

---

## 🚀 How to Run Locally

### 1. Start the Backend (Flask API)
1. Navigate to the backend directory:
   ```bash
   cd ehs-backend
   ```
2. Activate your virtual environment (if you have one) and start the server:
   ```bash
   .\venv\Scripts\python app.py
   ```
   *The backend will run on `http://127.0.0.1:5000`*

### 2. Start the Frontend (React/Vite)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd ehs-frontend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5174`*

---

> **Note:** To test the Offline SOS features on a desktop browser, use the "Simulate Network Outage" button in the top-left corner of the Patient Dashboard.
