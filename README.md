To use This!! 

*******Image Describer **********
Example Request (cURL)

curl -X POST https://ai-api-endpoint-eight.vercel.app/api/describe \
-H "Content-Type: application/json" \
-d '{
  "imageUrl": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0",
  "apiKey": "YOUR_GEMINI_API_KEY",
  "model": "gemini-2.5-flash"
}'
Successful Response

{
  "description": "A detailed description of the image..."
}

******** Object Finder *************
Example Request (cURL)

curl -X POST https://ai-api-endpoint-eight.vercel.app/api/find-objects \
-H "Content-Type: application/json" \
-d '{
  "imageUrl": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0",
  "objects": ["tree", "person", "bench"],
  "apiKey": "YOUR_GEMINI_API_KEY",
  "model": "gemini-2.5-flash"
}'
Successful Response

{
  "results": {
    "tree": { "found": true, "count": 1 },
    "person": { "found": false, "count": 0 },
    "bench": { "found": true, "count": 1 }
  }
}
