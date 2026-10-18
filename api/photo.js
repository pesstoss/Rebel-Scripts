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

        // 1. Grab ALL image links
        const allLinksRegex = /https:\/\/[^"'\s,>]+\.(?:jpg|jpeg|png|webp)/gi;
        const matches = [...new Set(cleanHtml.match(allLinksRegex) || [])];

        // 2. Filter out avatars and UI icons
        const validLinks = matches.filter(fullUrl => !fullUrl.includes('/avatars/') && !fullUrl.includes('/icons/'));

        // 3. Lock onto the Main Post's Folder ID (This kills the "More from Author" grid)
        let mainFolderId = null;
        for (const link of validLinks) {
            // Looks for the standard 36-character UUID format used by Vero folders
            const folderMatch = link.match(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\//i);
            if (folderMatch) {
                mainFolderId = folderMatch[1];
                break; // Stop at the very first one, which is always the main post
            }
        }

        // Only process links that belong to the main post's folder
        const postLinks = mainFolderId ? validLinks.filter(link => link.includes(mainFolderId)) : validLinks;
        const bestImages = new Map();

        for (const fullUrl of postLinks) {
            const filename = fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
            
            // Extract the 8-character image ID
            const baseIdMatch = filename.match(/^([a-z0-9]+)_/i);
            if (!baseIdMatch) continue;
            const imageId = baseIdMatch[1];

            // THE FIX: Strictly extract the resolution (e.g., 1620 from _1620x.webp or _1620.jpg)
            const resMatch = filename.match(/_(\d+)(?:[xw]|\.)/i);
            const size = resMatch ? parseInt(resMatch[1], 10) : 0;

            const existing = bestImages.get(imageId);
            if (!existing) {
                // Keep original index to maintain proper carousel order
                bestImages.set(imageId, { url: fullUrl, size: size, index: bestImages.size });
            } else if (size > existing.size) {
                existing.url = fullUrl;
                existing.size = size;
            }
        }

        // 4. Sort by original carousel order and return
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
