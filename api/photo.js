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

        // Extract the contents of the image/jpeg srcSet attribute
        const srcSetMatch = cleanHtml.match(/<source[^>]*type="image\/jpeg"[^>]*srcSet="([^"]+)"/i);
        
        if (!srcSetMatch) {
            return res.status(404).json({ error: 'Could not find high-res image source.' });
        }

        const srcSetData = srcSetMatch[1];
        
        // Split the srcSet by commas to evaluate each URL and its stated width
        const imageOptions = srcSetData.split(',').map(entry => entry.trim());
        
        let largestUrl = null;
        let maxWidth = 0;

        for (const option of imageOptions) {
            const parts = option.split(' ');
            if (parts.length === 2) {
                const imgUrl = parts[0];
                // Remove the "w" and parse the number
                const width = parseInt(parts[1].replace('w', ''), 10);
                
                if (width > maxWidth) {
                    maxWidth = width;
                    largestUrl = imgUrl;
                }
            }
        }

        if (!largestUrl) {
             return res.status(404).json({ error: 'Failed to parse image sizes.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        // Return as an array to match the frontend expectations
        res.status(200).json({ images: [largestUrl] });

    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}
