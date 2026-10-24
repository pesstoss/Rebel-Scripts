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
        // Disguise the server request as a real Chrome browser to bypass Cloudflare
        const postReq = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!postReq.ok) {
            return res.status(403).json({ error: 'Cloudflare blocked the Vercel server.' });
        }

        const cleanHtml = await postReq.text();

        // 1. Look for all srcSet attributes in both <source> and <img> tags
        const regex = /(?:<source|<img)[^>]*srcSet="([^"]+)"/gi;
        const matches = [...cleanHtml.matchAll(regex)];

        if (matches.length === 0) {
            return res.status(404).json({ error: 'Blocked by Cloudflare or could not find image sources.' });
        }

        const largestUrls = [];
        const seenIds = new Set(); // 2. Tracker to destroy format and layout duplicates

        // 3. Loop through every image node found in the HTML
        for (const match of matches) {
            const srcSet = match[1];
            let largestUrl = null;
            let maxWidth = 0;

            const sizeMatches = [...srcSet.matchAll(/(\S+)\s+(\d+)w/g)];
            
            for (const sizeMatch of sizeMatches) {
                let imgUrl = sizeMatch[1];
                
                // Clean any stray commas that might trick the parser
                imgUrl = imgUrl.replace(/,$/, ''); 
                const width = parseInt(sizeMatch[2], 10);

                // Grab the absolute largest version
                if (width > maxWidth && width > 600) {
                    maxWidth = width;
                    largestUrl = imgUrl;
                }
            }

            if (largestUrl) {
                // 4. Extract the unique core ID of the image (ignoring sizes and extensions)
                const idMatch = largestUrl.match(/\/([a-f0-9\-]+)_[0-9]+x\./i);
                const imageId = idMatch ? idMatch[1] : largestUrl;

                // 5. Only push if we haven't seen this exact photo ID yet
                if (!seenIds.has(imageId)) {
                    seenIds.add(imageId);
                    largestUrls.push(largestUrl);
                }
            }
        }
        
        if (largestUrls.length === 0) return res.status(404).json({ error: 'Failed to parse post images.' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: largestUrls }); 
            } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}