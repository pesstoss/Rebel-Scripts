export default async function handler(req, res) {
    const { url, targetImage } = req.query;

    if (targetImage) {
        try {
            const imgReq = await fetch(targetImage);
            const buffer = await imgReq.arrayBuffer();
            
            const contentType = imgReq.headers.get('content-type') || 'image/jpeg';
            res.setHeader('Content-Type', contentType); 
            res.setHeader('Content-Disposition', 'inline; filename="featured_photo.png"');
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

        // 1. Grab the very first folder ID (which always belongs to the featured post)
        const folderMatch = cleanHtml.match(/\/([a-f0-9\-]{36})\/([a-f0-9\-]{36})_/i);

        if (!folderMatch) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        const mainFolderId = folderMatch[1];

        // 2. Sweep the ENTIRE document for any URLs matching this specific Folder ID
        const fullRegex = new RegExp(`(https:\\/\\/[^"'\\s,\\>]+?\\/${mainFolderId}\\/[a-f0-9\\-]{36}_[^"'\\s,\\>]+)`, 'gi');
        const matches = [...cleanHtml.matchAll(fullRegex)];

        // 3. Score the width and keep the absolute largest
        const getResolutionScore = (url) => {
            const sizeMatch = url.match(/[_-](\d+)[xw]/i);
            return sizeMatch ? parseInt(sizeMatch[1], 10) : 0;
        };

        const uniqueImages = new Map();
        for (const match of matches) {
            const fullUrl = match[1];
            const imageIdMatch = fullUrl.match(/\/([a-f0-9\-]{36})_/i);
            
            if (imageIdMatch) {
                const imageId = imageIdMatch[1];
                const currentBest = uniqueImages.get(imageId);

                if (!currentBest) {
                    uniqueImages.set(imageId, fullUrl);
                } else {
                    const currentScore = getResolutionScore(currentBest);
                    const newScore = getResolutionScore(fullUrl);

                    if (newScore > currentScore) {
                        uniqueImages.set(imageId, fullUrl);
                    }
                }
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