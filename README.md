## Technology Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Axios
*   **Backend:** NestJS, TypeScript, Axios
*   **PDF Parsing:** GROBID (run in Docker)
*   **LLM:** Google Gemini API (`@google/generative-ai`)

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended, e.g., 18.x or 20.x)
*   [npm](https://www.npmjs.com/) (usually installed with Node.js)
*   [Docker](https://www.docker.com/products/docker-desktop/) (to run GROBID)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd academic-content-processor
    ```

2.  **Install server dependencies:**
    ```bash
    cd server
    npm install
    cd ..
    ```

3.  **Install client dependencies:**
    ```bash
    cd client
    npm install
    cd ..
    ```

## Configuration

### Server (Backend)

1.  Navigate to the `server` directory.
2.  Create a `.env` file in this directory.
3.  Add the following variables to the `.env` file, replacing values as needed:

    ```dotenv
    # Obtain from Google AI Studio (https://aistudio.google.com/app/apikey)
    GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE

    # URL where your local GROBID service is running (default Docker port)
    GROBID_URL=http://localhost:8070
    ```

### Client (Frontend)

1.  Navigate to the `client` directory.
2.  Create a `.env` file in this directory.
3.  Add the following variable to the `.env` file:

    ```dotenv
    # URL where your local Backend service (NestJS) is running
    VITE_API_BASE_URL=http://localhost:3000
    ```

*Important:* The `.env` files are listed in `.gitignore` and should not be committed to version control, especially `server/.env` containing your API key.

## Running GROBID

Before running the application, you need to start the GROBID service in Docker. Open a terminal and run:

```bash
docker run --rm --init -p 8070:8070 lfoppiano/grobid:0.8.0
```

Wait a few moments for GROBID to download models and start up. You can check its status by opening `http://localhost:8070` in your browser.

## Running the Application

1.  **Start the Backend Server:**
    *   Open a terminal in the `server` directory.
    *   Run the command:
        ```bash
        npm run start:dev
        ```
    *   The server will start on `http://localhost:3000` (by default).

2.  **Start the Frontend Client:**
    *   Open a **new** terminal in the `client` directory.
    *   Run the command:
        ```bash
        npm run dev
        ```
    *   The client will start on `http://localhost:5173` (by default).

3.  **Open the Application:**
    *   Open your web browser and navigate to `http://localhost:5173` (or the address provided by the `npm run dev` command).

## Testing

To run the backend unit tests:

1.  Navigate to the `server` directory.
2.  Run the command:
    ```bash
    npm run test
    ```

