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

        // 1. Skip the <head> entirely to prevent metadata hijacking
        const bodyOnly = postHtml.split('</head>')[1] || postHtml;

        // 2. Find the VERY FIRST <picture> tag to safely grab the main post's Folder ID.
        const firstImageMatch = bodyOnly.match(/<picture><source[^>]+srcSet=["']([^"']+)["']/i);
        if (!firstImageMatch) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        // Extract the Folder ID from that first string
        const firstUrl = firstImageMatch[1].split(' ')[0];
        const idMatch = firstUrl.match(/\/([a-f0-9\-]{36})\/[a-f0-9\-]{36}_/i);
        if (!idMatch) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        const folderId = idMatch[1]; // We now have the undisputed correct Folder ID for this post

        // 3. Sweep the ENTIRE document for any image URLs sharing this Folder ID.
        // This naturally captures the whole carousel while ignoring avatars and the Discovery grid.
        const regexStr = `https://[^"'\\s,>]+?/${folderId}/([a-f0-9\\-]{36})_[^"'\\s,>]+`;
        const fullRegex = new RegExp(regexStr, 'gi');
        
        // Unescape JSON slashes just in case they are hiding in React state
        const cleanHtml = postHtml.replace(/\\\//g, '/');
        const matches = [...cleanHtml.matchAll(fullRegex)];

        // 4. Deduplicate by Image ID so we only keep the highest resolution version of each photo
        const uniqueImages = new Map();
        for (const m of matches) {
            uniqueImages.set(m[1], m[0]); 
        }

        const finalImages = Array.from(uniqueImages.values());

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}