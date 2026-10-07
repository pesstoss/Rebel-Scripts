export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        // 1. Fetch the Vero post HTML
        const postReq = await fetch(url);
        const postHtml = await postReq.text();

        // 2. Extract the high-res og:image URL
        const imgMatch = postHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (!imgMatch) return res.status(404).json({ error: 'No image found' });

        const imageUrl = imgMatch[1];

        // 3. Fetch the actual image from Vero's server
        const imageReq = await fetch(imageUrl);
        const imageBuffer = await imageReq.arrayBuffer();

        // 4. Send it cleanly to the frontend
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        res.status(500).json({ error: 'Failed to proxy image' });
    }
}
