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

        // 1. THE SANDBOX: Strip away the <head> completely to prevent meta tags from hijacking the scraper
        const bodyOnly = cleanHtml.split('</head>')[1] || cleanHtml;

        // 2. Strip away the bottom half to avoid the Discovery grid
        const mainContentArea = bodyOnly.split('_user-post-content-container_')[0];

        // 3. Grab the VERY FIRST Folder ID strictly from this isolated body area
        const folderMatch = mainContentArea.match(/\/([a-f0-9\-]{36})\/([a-f0-9\-]{36})_/i);

        if (!folderMatch) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        const mainFolderId = folderMatch[1]; // We now have the undisputed correct ID

       // 4. Find all srcSet attributes in the safe content area that belong to this specific post
        // This explicitly targets the exact block you showed in your screenshot
        const srcSetRegex = new RegExp(`srcSet="([^"]+${mainFolderId}[^"]+)"`, 'gi');
        const srcSetMatches = [...mainContentArea.matchAll(srcSetRegex)];

        if (srcSetMatches.length === 0) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        // 5. Extract the highest-res URL from each srcSet
        const uniqueImages = new Map();
        for (const match of srcSetMatches) {
            const srcSetString = match[1]; 
            
            // Split the srcSet by comma to separate the different sizes
            const sources = srcSetString.split(',');
            
            // Grab the absolute LAST item in the srcSet, which is the highest resolution
            const bestSource = sources[sources.length - 1].trim(); 
            
            // A srcSet item looks like "https://..._1080x.webp 1080w". We split by space to drop the "1080w".
            const fullUrl = bestSource.split(' ')[0];

            // Extract the Image ID to deduplicate (so we don't get the same photo twice)
            const imageIdMatch = fullUrl.match(/\/([a-f0-9\-]{36})_/i);
            if (imageIdMatch) {
                const imageId = imageIdMatch[1];
                uniqueImages.set(imageId, fullUrl);
            }
        }

        const finalImages = Array.from(uniqueImages.values());

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        const finalImages = Array.from(uniqueImages.values());

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