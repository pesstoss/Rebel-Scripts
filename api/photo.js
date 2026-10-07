export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const postReq = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const postHtml = await postReq.text();

        // Extract all og:image and twitter:image tags
        const matches = [...postHtml.matchAll(/<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content="([^"]+)"/gi)]
            .map(m => m[1]);
        
        if (matches.length === 0) return res.status(404).json({ error: 'No image found' });

        // Filter out URLs that look like avatars, profiles, or user thumbnails
        const postImages = matches.filter(img => !/(avatar|profile|user|account|thumb)/i.test(img));

        // Fallback to the first match if all got filtered out
        const bestUrl = postImages.length > 0 ? postImages[0] : matches[0];

        const imageReq = await fetch(bestUrl);
        const imageBuffer = await imageReq.arrayBuffer();

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        res.status(500).json({ error: 'Failed to proxy image' });
    }
}
