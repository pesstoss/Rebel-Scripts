export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        // 1. Fetch the Vero post HTML
        const postReq = await fetch(url);
        const postHtml = await postReq.text();

        // 2. Extract ALL og:image and twitter:image tags globally
        const matches = [...postHtml.matchAll(/<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content="([^"]+)"/gi)];
        
        if (matches.length === 0) return res.status(404).json({ error: 'No image found' });

        // 3. Grab the LAST image in the list (this bypasses the default avatar)
        const imageUrl = matches[matches.length - 1][1];

        // 4. Fetch the actual image from Vero's server
        const imageReq = await fetch(imageUrl);
        const imageBuffer = await imageReq.arrayBuffer();

        // 5. Send it cleanly to the frontend
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        res.status(500).json({ error: 'Failed to proxy image' });
    }
}
