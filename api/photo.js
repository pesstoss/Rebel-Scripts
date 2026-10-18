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

        // 1. Find the FIRST UUID in the page. This is always the main post's folder.
        const uuidMatch = cleanHtml.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
        const mainFolderId = uuidMatch ? uuidMatch[0] : null;

        // 2. Grab all raw URLs
        const allUrls = cleanHtml.match(/https:\/\/[^"'\s,>]+/gi) || [];

        // 3. Filter for images that belong ONLY to the main post (avoids the other birds)
        const imageLinks = allUrls.filter(link => 
            (mainFolderId ? link.includes(mainFolderId) : true) && 
            /\.(jpg|jpeg|png|webp)/i.test(link) &&
            !link.includes('/avatars/') &&
            !link.includes('/icons/')
        );

        const bestImages = new Map();

        for (const link of imageLinks) {
            const cleanLink = link.replace(/[\\)\]]+$/, ''); // Clean trailing characters
            const parts = cleanLink.split('/');
            const filename = parts.pop();
            
            // Group by the image prefix (everything before the first underscore)
            const groupId = filename.split('_')[0];

            // Extract all numbers to find the resolution
            const numbers = [...filename.matchAll(/(\d+)/g)].map(m => parseInt(m[1], 10));
            const size = numbers.length > 0 ? Math.max(...numbers) : 0;

            const existing = bestImages.get(groupId);
            if (!existing) {
                bestImages.set(groupId, { url: cleanLink, size, index: bestImages.size });
            } else if (size > existing.size) {
                bestImages.set(groupId, { url: cleanLink, size, index: existing.index });
            }
        }

        const finalImages = Array.from(bestImages.values())
            .sort((a, b) => a.index - b.index)
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
