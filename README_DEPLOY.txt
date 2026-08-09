REVERIOUS AI - VISION AUTOFALLBACK

1. Upload index.html and script.js together to Vercel.
2. The script now tries:
   - OpenRouter Gemma 4 31B free
   - OpenRouter Gemma 4 26B A4B free
   - Groq Qwen 3.6 27B Vision
3. Provider fallback is enabled for OpenRouter.
4. index.html includes a cache-busting query so the new script is loaded.
5. For security, move API keys to a Vercel backend/environment variables before public production use.
