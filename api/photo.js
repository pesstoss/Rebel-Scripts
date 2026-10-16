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
        
        // Clean any escaped JSON quotes/slashes so our Regex reads the text perfectly
        const cleanHtml = postHtml.replace(/\\"/g, '"').replace(/\\\//g, '/');

        // 1. COUNT DOTS: Determine carousel length (defaults to 1 for single photos)
        const dotsMatch = cleanHtml.match(/data-dot="true"/gi);
        const imageCount = Math.max(1, dotsMatch ? dotsMatch.length : 1);

        // 2. EXTRACT ALL SRCSETS: This naturally bypasses avatars/metadata which use standard 'src'
        const srcSetRegex = /srcSet=["']([^"']+)["']/gi;
        const matches = [...cleanHtml.matchAll(srcSetRegex)];

        if (matches.length === 0) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        // 3. GET HIGHEST RESOLUTION: Take the very last URL from each srcSet string
        const extractedUrls = matches.map(match => {
            const urls = match[1].split(',').map(s => s.trim().split(' ')[0]);
            return urls[urls.length - 1]; 
        });

        // 4. DEDUPLICATE: Because of responsive desktop/mobile views, images often appear twice in the HTML
        const uniqueUrls = [...new Set(extractedUrls)].filter(u => u && u.startsWith('http'));

        // 5. SLICE & DICE: The main post is always at the top of the document.
        // Keeping only the first `imageCount` URLs automatically throws away any previous grid thumbnails below!
        const finalImages = uniqueUrls.slice(0, imageCount);

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}