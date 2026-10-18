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

        // 1. Grab EVERY image link on the entire page
        const allLinksRegex = /(https:\/\/[^"'\s,>]+\/[a-f0-9\-]{36}\/[a-f0-9\-]{36}_[^"'\s,>]+)/gi;
        const matches = [...cleanHtml.matchAll(allLinksRegex)];

        // 2. Build the array exactly as you suggested: get the ID, the URL, and the size number
        const imageList = [];
        for (const match of matches) {
            const fullUrl = match[1];
            const idMatch = fullUrl.match(/\/([a-f0-9\-]{36})_/i);
            const sizeMatch = fullUrl.match(/[_-](\d+)[xw]/i); // Extracts the number before x or w

            if (idMatch && sizeMatch) {
                imageList.push({
                    id: idMatch[1],
                    url: fullUrl,
                    size: parseInt(sizeMatch[1], 10)
                });
            }
        }

        // 3. Deduplicate by keeping ONLY the array item with the highest size number
        const bestImages = new Map();
        for (const img of imageList) {
            const existing = bestImages.get(img.id);
            if (!existing || img.size > existing.size) {
                bestImages.set(img.id, img);
            }
        }

        // 4. Format the final list and instantly kill any tiny profile pics (under 600px)
        const finalImages = Array.from(bestImages.values())
            .filter(img => img.size >= 600)
            .map(img => img.url);

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'No high-res images found.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}