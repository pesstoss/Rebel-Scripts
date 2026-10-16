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

        // 1. THE RESOLUTION FILTER: 
        // We only extract Vero image URLs that explicitly end in 1080x, 650x, or orig.
        // This makes the script entirely blind to tiny avatars and old grid thumbnails.
        // Group 1 captures the Image UUID (for deduplication). Group 2 captures the size.
        const highResRegex = /https:\/\/[a-z0-9.-]+\/(?:thumb\/|public\/)?[a-f0-9\-]{36}\/([a-f0-9\-]{36})_(1080x|650x|orig)[^\s"'<>,\\\\]+/gi;
        const matches = [...cleanHtml.matchAll(highResRegex)];

        if (matches.length === 0) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        // 2. Deduplicate by Image ID and keep the highest resolution
        const uniqueImages = new Map();

        for (const match of matches) {
            const fullUrl = match[0];
            const imageId = match[1];
            const resMarker = match[2]; // '1080x', '650x', or 'orig'

            // Assign a numerical weight so we can prioritize the best quality
            let weight = 1; 
            if (resMarker === '1080x') weight = 2;
            if (resMarker === 'orig') weight = 3;

            const existing = uniqueImages.get(imageId);
            
            // Save if it's a new image, or overwrite if this version has a higher resolution
            if (!existing || weight > existing.weight) {
                uniqueImages.set(imageId, { url: fullUrl, weight: weight });
            }
        }

        // 3. Extract just the URLs into our final array
        const finalImages = Array.from(uniqueImages.values()).map(item => item.url);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}