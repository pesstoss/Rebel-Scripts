export default async function handler(req, res) {
    const { url, targetImage } = req.query;

    // MODE 1: Proxy a specific image to bypass CORS for canvas downloading
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

    // MODE 2: Scrape the Vero link for the carousel
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const postReq = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const postHtml = await postReq.text();

        // 1. Broaden regex to include .webp and catch JSON-escaped slashes (\/)
        const regex = /https:(?:\\?\/){2}[^"'\s<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi;
        const rawMatches = [...postHtml.matchAll(regex)].map(m => m[0]);

        const uniqueImageMap = new Map();

        rawMatches.forEach(rawUrl => {
            // 2. Un-escape JSON slashes if the image was hidden inside a <script> tag
            const imgUrl = rawUrl.replace(/\\\//g, '/');

            // 3. Aggressively filter out avatars, UI icons, and logos
            if (/(avatar|profile|user|account|thumb|icon|logo|banner)/i.test(imgUrl)) return;

            // Strip query parameters to find the base file name
            const baseUrl = imgUrl.split('?')[0];

            // Deduplicate: Only save one version of each base image
            if (!uniqueImageMap.has(baseUrl)) {
                uniqueImageMap.set(baseUrl, imgUrl);
            }
        });

        const finalImages = Array.from(uniqueImageMap.values());

        if (finalImages.length === 0) return res.status(404).json({ error: 'No images found' });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}
