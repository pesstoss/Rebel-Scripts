export default async function handler(req, res) {
    const { url, targetImage } = req.query;

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

    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const postReq = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const postHtml = await postReq.text();

        // 1. Isolate the HTML block containing ONLY the main post media. 
        // This physically cuts out the Discovery grid and avatars at the bottom of the page.
        const mediaBlockMatch = postHtml.match(/_user-post-media-container_[^>]*>([\s\S]*?)_user-post-content-container_/);
        const mediaBlock = mediaBlockMatch ? mediaBlockMatch[1] : postHtml;

        // 2. Find all responsive image IDs (e.g., _1080x, _450x). 
        // Because we are only looking inside 'mediaBlock', we get exactly the right number of photos.
        const regex = /([a-z0-9\-]{36})\/([a-z0-9\-]{36})_[0-9]+x\.(?:jpg|jpeg|png|webp)/gi;

        const matches = [...mediaBlock.matchAll(regex)];

        // 3. Rebuild high-res original URLs and deduplicate them instantly
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