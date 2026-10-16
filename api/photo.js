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

        // 1. Cut the page in half just to find the main post's unique folder ID
        const topHalf = cleanHtml.split('_user-post-content-container_')[0];
        const idRegex = /https:\/\/(?:d1dpu3msttfsqg\.cloudfront\.net|media\.verocdn\.com)(?:\/thumb|\/public)?\/([a-z0-9\-]{36})\/([a-z0-9\-]{36})_/i;
        const firstImageMatch = topHalf.match(idRegex);

        if (!firstImageMatch) return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

        const folderId = firstImageMatch[1]; // The unique gallery ID for this specific post

        // 2. Now sweep the ENTIRE page (including the JSON block) for ANY image sharing this exact folder ID
        const fullRegex = new RegExp(`https://(?:d1dpu3msttfsqg\\.cloudfront\\.net|media\\.verocdn\\.com)(?:/thumb|/public)?/${folderId}/([a-z0-9\\-]{36})_[^\\s",]+?(?:\\.webp|\\.jpg)`, 'gi');
        const matches = [...cleanHtml.matchAll(fullRegex)];

        // 3. Deduplicate by Image ID. By overwriting the Map as we scan left-to-right, we automatically keep the LAST url in the srcset, which is the highest resolution!
        const uniqueImages = new Map();
        for (const match of matches) {
            uniqueImages.set(match[1], match[0]); // match[1] is the Image ID, match[0] is the full URL
        }

        const finalImages = Array.from(uniqueImages.values());

        if (finalImages.length === 0) return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}