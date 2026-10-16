export default async function handler(req, res) {
    const { url, targetImage } = req.query;

    if (targetImage) {
        try {
            const imgReq = await fetch(targetImage);
            const buffer = await imgReq.arrayBuffer();
            // Pass the original content type through or default to jpeg/webp depending on your app's needs
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

        // 1. Cut the page in half to avoid the bottom Discovery grid
        const topHalf = postHtml.split('_user-post-content-container_')[0];

        // 2. Lock onto the <picture> tags directly to avoid grabbing avatars, capturing the literal first URL regardless of extension (.webp or .jpg)
        const regex = /<picture><source[^>]*srcSet="(https:\/\/[^\s",]+)/gi;
        const matches = [...topHalf.matchAll(regex)];

        // 3. Keep the URLs completely unmodified and deduplicate them
        const finalImages = [...new Set(matches.map(m => m[1]))];

        if (finalImages.length === 0) return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}