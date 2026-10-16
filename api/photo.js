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
        const cleanHtml = postHtml.replace(/\\\//g, '/');

        // 1. THE SANDBOX: Strip the <head> to completely blind the scraper to the avatar metadata
        const bodyOnly = cleanHtml.split('</head>')[1] || cleanHtml;

        // 2. ISOLATE MEDIA BLOCK: Vero renders the photos at the very top of the body, followed by a specific container for the caption and bottom grid.
        // By splitting here, we throw the bottom grid in the trash. What remains is ONLY the main post media!
        const mediaBlock = bodyOnly.split(/_user-post-content-(?:container|header)_/)[0];

        // 3. PURE TEXT SCAN: Sweep this perfectly isolated block for ANY valid Vero image URL.
        // This ignores HTML tags completely, making it immune to formatting changes.
        // Group 1 captures the Image ID to use for deduplication.
        const urlRegex = /https:\/\/[a-z0-9.-]+\/(?:thumb\/|public\/)?[a-f0-9\-]{36}\/([a-f0-9\-]{36})_[^\s"'<>,\\\\]+/gi;
        const matches = [...mediaBlock.matchAll(urlRegex)];

        if (matches.length === 0) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        // 4. Deduplicate by Image ID (match[1]).
        // Because responsive URLs go from smallest to largest in the code, overwriting the Map keeps the LAST (highest quality) version of each photo!
        const uniqueImages = new Map();
        for (const match of matches) {
            uniqueImages.set(match[1], match[0]); 
        }

        const finalImages = Array.from(uniqueImages.values());

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}