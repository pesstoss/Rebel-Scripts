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

        // Grab ALL image links ending in jpg, jpeg, png, or webp
        const allLinksRegex = /https:\/\/[^"'\s,>]+\.(?:jpg|jpeg|png|webp)/gi;
        const matches = [...new Set(cleanHtml.match(allLinksRegex) || [])];

        const bestImages = new Map();

        for (const fullUrl of matches) {
            // Skip UI elements
            if (fullUrl.includes('/avatars/') || fullUrl.includes('icon')) continue;

            const urlParts = fullUrl.split('/');
            const filename = urlParts.pop();
            
            // Group by the unique prefix (e.g., "1d938efc") or fallback to parent folder
            const baseIdMatch = filename.match(/^([a-z0-9]+)_/i);
            const groupId = baseIdMatch ? baseIdMatch[1] : urlParts.pop();

            // Extract all numbers from the filename to score resolution
            const numbers = [...filename.matchAll(/(\d+)/g)].map(m => parseInt(m[1], 10));
            const size = numbers.length > 0 ? Math.max(...numbers) : 0;

            const existing = bestImages.get(groupId);
            if (!existing || size > existing.size) {
                bestImages.set(groupId, { url: fullUrl, size });
            }
        }

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
