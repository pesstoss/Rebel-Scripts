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
        
        // Unescape JSON slashes so we can read URLs hidden in the React state block
        const cleanHtml = postHtml.replace(/\\\//g, '/');

        // 1. Sweep the ENTIRE document for any URL containing the "UUID/UUID_" signature.
        // Group 1: Full URL | Group 2: Folder ID (36 chars) | Group 3: Image ID (36 chars)
        const regex = /(https:\/\/[^"'\s,\\>]+?\/([a-f0-9\-]{36})\/([a-f0-9\-]{36})_[^"'\s,\\>]+)/gi;
        const matches = [...cleanHtml.matchAll(regex)];

        if (matches.length === 0) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        // 2. The very first match in the document is guaranteed to be the main post (usually from the <head> meta tags)
        const mainFolderId = matches[0][2];

        // 3. Filter matches to only keep URLs from this specific post's folder ID, ignoring Discovery grid photos.
        // Deduplicate by Image ID so we only keep the first (highest resolution) version of each photo.
        const uniqueImages = new Map();
        for (const match of matches) {
            const fullUrl = match[1];
            const folderId = match[2];
            const imageId = match[3];

            if (folderId === mainFolderId && !uniqueImages.has(imageId)) {
                uniqueImages.set(imageId, fullUrl);
            }
        }

        const finalImages = Array.from(uniqueImages.values());

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}