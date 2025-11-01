# HatchOS

HatchOS is a custom-built system designed to connect and manage hardware devices using a central server and a React-based web app. It focuses on automation, control, and performance testing using the Raspberry Pi 5 as the main board. The project aims to create a seamless interface between physical hardware and web-based controls. It serves as the core environment for testing AI-driven automation features, local device networking, and system management.

## Setup Instructions

1. **Hardware:**  
   Use a **Raspberry Pi 5**.  
   Make sure your **display does not use GPIO** pins — use HDMI instead.

2. **Server:**  
   In the main folder, run:  
   ```bash
   python3 server.py
   ```

3. **App:**  
   Go to the `app` folder and install dependencies:  
   ```bash
   npm install
   ```  
   Then start the app:  
   ```bash
   npm run dev
   ```
