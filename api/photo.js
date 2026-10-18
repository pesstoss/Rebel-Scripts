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

        // Extract the explicit size data Vero provides
        const srcSetMatch = cleanHtml.match(/<source[^>]*type="image\/jpeg"[^>]*srcSet="([^"]+)"/i);
        
        if (!srcSetMatch) {
            return res.status(404).json({ error: 'Blocked by Cloudflare or could not find image source.' });
        }

        const imageOptions = srcSetMatch[1].split(',').map(entry => entry.trim());
        let largestUrl = null;
        let maxWidth = 0;

        for (const option of imageOptions) {
            const parts = option.split(' ');
            if (parts.length === 2) {
                const imgUrl = parts[0];
                const width = parseInt(parts[1].replace('w', ''), 10);
                
                if (width > maxWidth) {
                    maxWidth = width;
                    largestUrl = imgUrl;
                }
            }
        }

        if (!largestUrl) return res.status(404).json({ error: 'Failed to parse image sizes.' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: [largestUrl] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}
