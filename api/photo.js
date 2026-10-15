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

        // 1. Extract the raw IDs for ALL original photos in the JSON payload (Bypasses lazy-loading)
        const regex = /([a-z0-9\-]{36})[\\\/]+([a-z0-9\-]{36})[\\\/]+original\.(?:jpg|jpeg|png|webp)/gi;
        const matches = [...postHtml.matchAll(regex)];

        // 2. Rebuild clean URLs and deduplicate them
        const allOriginalImages = [...new Set(matches.map(m => 
            `https://media.verocdn.com/public/${m[1]}/${m[2]}/original.jpg`
        ))];

        // 3. Count the carousel dots to know exactly how many photos belong to the main post
        const dotMatches = [...postHtml.matchAll(/<span data-dot="true"/gi)];
        const photoCount = dotMatches.length > 0 ? dotMatches.length : 1;

        // 4. Slice the array to keep only the post's photos, cleanly chopping off the 7 Discovery grid photos
        const finalImages = allOriginalImages.slice(0, photoCount);

        if (finalImages.length === 0) return res.status(404).json({ error: 'No images found' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}