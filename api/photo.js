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
        
        // Unescape JSON slashes so any URLs hiding in React state are perfectly readable
        const cleanHtml = postHtml.replace(/\\\//g, '/');

        // 1. The Sandbox: Throw away the <head> to completely avoid avatar/metadata hijacking
        const parts = cleanHtml.split('</head>');
        const bodyText = parts.length > 1 ? parts[1] : cleanHtml;

        // 2. Pure Text Scan: Find the VERY FIRST valid Vero image URL in the body text.
        // This completely ignores HTML tags. It just looks for the raw URL signature: domain / folder-uuid / image-uuid
        const urlSignature = /https:\/\/[a-z0-9.-]+\/(?:thumb\/|public\/)?([a-f0-9\-]{36})\/([a-f0-9\-]{36})_[^\s"'<>,]+/i;
        const firstMatch = bodyText.match(urlSignature);

        if (!firstMatch) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        const folderId = firstMatch[1]; // The exact Folder ID for this carousel

        // 3. Sweep the ENTIRE document (including the JSON block) for all URLs sharing this Folder ID
        const regexString = `https://[a-z0-9.-]+/(?:thumb/|public/)?${folderId}/([a-f0-9\\-]{36})_[^\\s"'<>,\\\\]+`;
        const globalRegex = new RegExp(regexString, 'gi');
        const allMatches = [...cleanHtml.matchAll(globalRegex)];

        // 4. Deduplicate by Image ID. 
        // Because srcSet strings list lowest-to-highest resolution, overwriting the Map keeps the LAST (highest quality) URL for each photo!
        const uniqueImages = new Map();
        for (const match of allMatches) {
            uniqueImages.set(match[1], match[0]); // match[1] is Image ID, match[0] is full URL
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