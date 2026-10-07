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

        // 3. Smart Filter: Find an image URL that is NOT a profile avatar or user thumbnail
        let imageUrl = matches.find(img => !/(avatar|profile|user)/i.test(img));

        // Fallback to the first image if all match the filter
        if (!imageUrl) {
            imageUrl = matches[0];
        }

        // 4. Fetch the actual content image from Vero's server
        const imageReq = await fetch(imageUrl);
        const imageBuffer = await imageReq.arrayBuffer();

        // 5. Send it cleanly to the frontend
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        res.status(500).json({ error: 'Failed to proxy image' });
    }
}
