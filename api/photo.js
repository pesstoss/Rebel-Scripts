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

        // 1. Isolate the top half
        const topHalf = cleanHtml.split('_user-post-content-container_')[0];

        // 2. Extract the Folder ID strictly from the first <picture> tag to bypass avatars
        const pictureRegex = /<picture><source[^>]*srcSet="https:\/\/[^\/]+\/(?:thumb\/|public\/)?([a-z0-9\-]{36})\/([a-z0-9\-]{36})_/i;
        const idMatch = topHalf.match(pictureRegex);

        if (!idMatch) return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

        const folderId = idMatch[1]; // The main post's unique folder ID

        // 3. Sweep the ENTIRE document (including JSON) for any URLs sharing this Folder ID
        const fullRegex = new RegExp(`(https:\/\/[^/]+\/(?:thumb\/|public\/)?${folderId}\/([a-z0-9\\-]{36})_[^\\s",]+)`, 'gi');
        const matches = [...cleanHtml.matchAll(fullRegex)];

        // 4. Deduplicate by Image ID (match[2]), keeping only the very first one it finds (the highest resolution)
        const uniqueImages = new Map();
        for (const match of matches) {
            if (!uniqueImages.has(match[2])) {
                uniqueImages.set(match[2], match[1]); // Store by Image ID -> URL
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