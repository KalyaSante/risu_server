# Docker and Docker Compose Setup

This document provides instructions on how to build, run, and manage this application using Docker and Docker Compose.

## Prerequisites

*   Docker installed: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
*   Docker Compose installed (usually included with Docker Desktop): [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

## Project Structure

*   `Dockerfile`: Defines the Docker image for the application.
*   `.dockerignore`: Specifies files and directories to exclude from the Docker image.
*   `docker-compose.yml`: Configures how to run the application service, including volume mounts for data persistence and environment variable management.
*   `.env.example`: Example environment variables. You'll need to create a `.env` file based on this for local development and on your server.

## Local Development with Docker Compose

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-name>
    ```

2.  **Create a `.env` file:**
    Copy the `.env.example` to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
    Review and update the variables in the `.env` file as needed for your local environment.
    **Important:** Generate an `APP_KEY` if it's missing:
    ```bash
    # If you have Node.js and npm installed locally:
    npm install --omit=dev # Install dependencies to get Adonis ace
    node ace generate:key
    # Copy the generated key into your .env file for the APP_KEY variable.
    # Alternatively, you can run this command inside a temporary container if you prefer not to install Node.js locally:
    # docker-compose run --rm app node ace generate:key
    # Then copy the output to your .env file.
    ```

3.  **Build and run the application:**
    ```bash
    docker-compose up --build
    ```
    *   `--build`: Forces Docker Compose to rebuild the image if the `Dockerfile` or application code has changed.
    *   You can add `-d` to run in detached mode (in the background): `docker-compose up --build -d`

4.  **Accessing the application:**
    Once the containers are running, the application should be accessible at `http://localhost:3333` (or the port you configured).

5.  **Stopping the application:**
    ```bash
    docker-compose down
    ```
    *   To stop and remove volumes (like the database data, use with caution): `docker-compose down -v`

## Database Persistence

The `docker-compose.yml` is configured to persist the SQLite database.
*   The database file (`db.sqlite3`) from within the container's `/app/tmp` directory is mapped to a `./data/db` directory on your host machine (relative to your `docker-compose.yml`).
*   This means your database will survive container restarts (`docker-compose up/down`).
*   The `tmp` directory inside the container is created by the `Dockerfile`.

## Environment Variables

*   For **local development**, `docker-compose` loads variables from the `.env` file in the project root.
*   For **production/server deployment**, when you place the `docker-compose.yml` file on your server, create a `.env` file in the *same directory* on the server. This file should contain your production-specific settings (e.g., `NODE_ENV=production`, your production `APP_KEY`, etc.). The `docker-compose.yml` is configured to read this `.env` file.

## Automated Image Publishing with GitHub Actions

This project is set up with a GitHub Actions workflow (see `.github/workflows/docker-image.yml`) to automatically build and publish the Docker image to the GitHub Container Registry (GHCR).

*   **Trigger:** The workflow runs on every push to the `main` branch.
*   **Image Name:** `ghcr.io/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME` (e.g., `ghcr.io/johndoe/my-app`).
*   **Privacy:** The image will be private if your repository is private.
*   **Tags:** Images are tagged with the commit SHA and `latest` (for pushes to the `main` branch).

### Using the Published Image on a Server

1.  **Log in to GHCR on your server:**
    You'll need a Personal Access Token (PAT) with the `read:packages` scope.
    ```bash
    export CR_PAT=<your_github_pat>
    echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
    ```

2.  **Update `docker-compose.yml` on the server (Optional but Recommended):**
    Instead of building the image on the server, you can modify the `docker-compose.yml` to pull the pre-built image from GHCR.
    Replace the `build` section with `image`:
    ```yaml
    services:
      app:
        # build:  # Remove or comment out this
        #   context: .
        #   dockerfile: Dockerfile
        image: ghcr.io/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME:latest # Or a specific SHA tag
        ports:
          - "3333:3333"
        volumes:
          - ./data/db:/app/tmp
        env_file:
          - .env
        environment:
          - NODE_ENV=production
          - HOST=0.0.0.0
        restart: unless-stopped
    ```
    Remember to replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME`.

3.  **Pull the image and start services:**
    ```bash
    docker-compose pull app # Pulls the image specified for the 'app' service
    docker-compose up -d
    ```

## Troubleshooting

*   **Permissions issues with `tmp` or `data/db`:** Ensure the user running Docker has write permissions to the `./data/db` directory on the host if you encounter issues. The `Dockerfile` creates `/app/tmp` and sets permissions for the `node` user within the container.
*   **`APP_KEY` not set:** The application will not run correctly without a valid `APP_KEY`. Make sure it's in your `.env` file.
*   **Port conflicts:** If port `3333` is already in use on your host, change the host port mapping in `docker-compose.yml` (e.g., `"8080:3333"`).
