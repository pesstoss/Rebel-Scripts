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
        
        // Unescape JSON slashes to read URLs hidden in the React state block
        const cleanHtml = postHtml.replace(/\\\//g, '/');

        // 1. Find the srcSet of the very first <picture> tag to bypass meta tags and avatars
        const pictureMatch = cleanHtml.match(/<picture><source[^>]*srcSet="([^"]+)"/i);
        if (!pictureMatch) return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

        // 2. Grab the first URL from that srcSet and extract the Folder ID
        const firstUrl = pictureMatch[1].split(' ')[0];
        const idMatch = firstUrl.match(/\/([a-z0-9\-]{36})\/([a-z0-9\-]{36})_/i);
        if (!idMatch) return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

        const folderId = idMatch[1]; // The unique gallery ID for this specific post

        // 3. Sweep the ENTIRE document (including JSON) for any URL sharing this folder ID.
        // Double backslashes used correctly to ensure \\s evaluates to whitespace in the Regex engine.
        const fullRegex = new RegExp(`https://[^\\s",]+?/${folderId}/[a-z0-9\\-]+_[^\\s",]+`, 'gi');
        const matches = [...cleanHtml.matchAll(fullRegex)];

        // 4. Deduplicate by the Image ID so we only get the very first (largest) version of each photo
        const uniqueImages = new Map();
        for (const match of matches) {
            const fullUrl = match[0];
            const imgIdMatch = fullUrl.match(/\/([a-z0-9\-]{36})_/i);
            
            if (imgIdMatch && !uniqueImages.has(imgIdMatch[1])) {
                uniqueImages.set(imgIdMatch[1], fullUrl); 
            }
        }

        const finalImages = Array.from(uniqueImages.values());

        if (finalImages.length === 0) return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}