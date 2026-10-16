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

        // 1. THE SANDBOX: Strip away the <head> to prevent meta tag hijacking, and cut the bottom to avoid the Discovery grid
        const bodyOnly = postHtml.split('</head>')[1] || postHtml;
        const mainContentArea = bodyOnly.split('_user-post-content-container_')[0];

        // 2. Grab the srcSet attribute from EVERY <picture> tag inside this isolated sandbox
        const srcSetRegex = /<picture>[\s\S]*?srcSet=["']([^"']+)["']/gi;
        const matches = [...mainContentArea.matchAll(srcSetRegex)];

        // 3. Extract the first URL (stopping at the space) from each srcSet and deduplicate
        const finalImages = [...new Set(matches.map(match => match[1].split(' ')[0]))];

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}