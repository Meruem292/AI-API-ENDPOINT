# AI Vision API Endpoints

This document provides instructions on how to use the API endpoints for the AI Vision application. You can use these endpoints to programmatically describe images and find objects within them.

Replace `[YOUR_APP_URL]` with the URL where your application is deployed.

---

## 1. Image Describer

This endpoint generates a detailed text description for a given image.

### Endpoint

`POST [YOUR_APP_URL]/api/describe`

### Request Body

The request body must be a JSON object with the following properties:

-   `imageUrl` (string, required): The public URL of the image to analyze.
-   `apiKey` (string, required): Your Gemini API key.
-   `model` (string, required): The Gemini model to use (e.g., `gemini-2.5-flash`).

### Example Request (cURL)

```bash
curl -X POST [YOUR_APP_URL]/api/describe \
-H "Content-Type: application/json" \
-d '{
  "imageUrl": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0",
  "apiKey": "YOUR_GEMINI_API_KEY",
  "model": "gemini-2.5-flash"
}'
```

### Successful Response

The API will return a JSON object with a `description` property.

```json
{
  "description": "A detailed description of the image..."
}
```

---

## 2. Object Finder

This endpoint finds and counts specific objects within an image.

### Endpoint

`POST [YOUR_APP_URL]/api/find-objects`

### Request Body

The request body must be a JSON object with the following properties:

-   `imageUrl` (string, required): The public URL of the image to analyze.
-   `objects` (array of strings, required): A list of object names to find in the image.
-   `apiKey` (string, required): Your Gemini API key.
-   `model` (string, required): The Gemini model to use (e.g., `gemini-2.5-flash`).

### Example Request (cURL)

```bash
curl -X POST [YOUR_APP_URL]/api/find-objects \
-H "Content-Type: application/json" \
-d '{
  "imageUrl": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0",
  "objects": ["tree", "person", "bench"],
  "apiKey": "YOUR_GEMINI_API_KEY",
  "model": "gemini-2.5-flash"
}'
```

### Successful Response

The API will return a JSON object containing the results.

```json
{
  "results": {
    "tree": { "found": true, "count": 1 },
    "person": { "found": false, "count": 0 },
    "bench": { "found": true, "count": 1 }
  }
}
```
