export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        // 1. Fetch the Vero post HTML with a standard browser User-Agent
        const postReq = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const postHtml = await postReq.text();

        // 2. Extract ALL og:image and twitter:image tags globally
        const matches = [...postHtml.matchAll(/<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content="([^"]+)"/gi)]
            .map(m => m[1]);
        
        if (matches.length === 0) return res.status(404).json({ error: 'No image found' });

        // 3. Smart Size Check: Find the image with the largest file size (Content-Length)
        let bestUrl = matches[0];
        let maxBytes = 0;

        for (const imgUrl of matches) {
            try {
                // Send a lightweight HEAD request to check file size without downloading the image yet
                const headRes = await fetch(imgUrl, { method: 'HEAD' });
                const contentLength = headRes.headers.get('content-length');
                const bytes = contentLength ? parseInt(contentLength, 10) : 0;

                // If this image is bigger than the previous winner, it's our post photo!
                if (bytes > maxBytes) {
                    maxBytes = bytes;
                    bestUrl = imgUrl;
                }
            } catch (e) {
                // If a HEAD request fails for one of them, just skip it and check the rest
            }
        }

        // 4. Fetch the actual winner (the largest image) from Vero's server
        const imageReq = await fetch(bestUrl);
        const imageBuffer = await imageReq.arrayBuffer();

        // 5. Send it cleanly to the frontend
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        res.status(500).json({ error: 'Failed to proxy image' });
    }
}
