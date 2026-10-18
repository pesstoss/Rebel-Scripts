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
        const cleanHtml = (await postReq.text()).replace(/\\\//g, '/');

        const allLinksRegex = /(https:\/\/[^"'\s,>]+\/[a-f0-9\-]{36}\/[a-f0-9\-]{36}_[^"'\s,>]+)/gi;
        const matches = [...cleanHtml.matchAll(allLinksRegex)];

        const bestImages = new Map();

        for (const match of matches) {
            const fullUrl = match[1];
            const idMatch = fullUrl.match(/\/([a-f0-9\-]{36})_/i);
            
            // If we find an ID, process it even if there is no w/x size marker
            if (idMatch) {
                const id = idMatch[1];
                const sizeMatch = fullUrl.match(/[_-](\d+)[xw]/i);
                const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;

                const existing = bestImages.get(id);
                // Keep the one with the highest size score
                if (!existing || size > existing.size) {
                    bestImages.set(id, { id, url: fullUrl, size });
                }
            }
        }

        // Sort the remaining images from largest to smallest, no strict filters!
        const finalImages = Array.from(bestImages.values())
            .sort((a, b) => b.size - a.size)
            .map(img => img.url);

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'No images found.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}
