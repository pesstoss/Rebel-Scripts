export default async function handler(req, res) {
    const { url, targetImage } = req.query;

    // MODE 1: Proxy a specific image to bypass CORS for canvas downloading
    if (targetImage) {
        try {
            const imgReq = await fetch(targetImage);
            const buffer = await imgReq.arrayBuffer();
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.send(Buffer.from(buffer));
        } catch (error) {
            return res.status(500).json({ error: 'Failed to proxy image' });
        }
    }

    // MODE 2: Scrape the Vero link for the carousel
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const postReq = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const postHtml = await postReq.text();

        // 1. Target the exact 36-character IDs of the main images by looking for the unique "650x" size tag
        const regex = /https:\/\/[^"'\\]+\/([a-z0-9\-]{36})\/([a-z0-9\-]{36})_650x\.jpg/gi;

        // 2. Extract all matches from the HTML
        const matches = [...postHtml.matchAll(regex)];

        // 3. Rebuild the high-res original URLs and deduplicate them instantly using a Set
        const finalImages = [...new Set(matches.map(m => 
            `https://media.verocdn.com/public/${m[1]}/${m[2]}/original.jpg`
        ))];

        if (finalImages.length === 0) return res.status(404).json({ error: 'No images found' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}