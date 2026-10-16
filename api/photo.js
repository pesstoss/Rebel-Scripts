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

        // 1. THE SANDBOX: Strip the <head> to completely avoid avatar/metadata hijacking
        const bodyOnly = cleanHtml.split('</head>')[1] || cleanHtml;

        // 2. Count the carousel dots in the isolated body (defaults to 1 for single-photo posts)
        const dotsMatch = bodyOnly.match(/data-dot="true"/gi);
        const imageCount = Math.max(1, dotsMatch ? dotsMatch.length : 1);

        // 3. Extract the srcSet from ALL <picture> tags strictly inside the body sandbox
        const pictureRegex = /<picture>[\s\S]*?srcSet=["']([^"']+)["']/gi;
        const matches = [...bodyOnly.matchAll(pictureRegex)];

        if (matches.length === 0) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        // 4. Slice the array to keep exactly the number of images we counted from the dots
        const postPictures = matches.slice(0, imageCount);

        // 5. Extract the highest resolution URL from each srcSet
        const finalImages = postPictures.map(match => {
            const srcSet = match[1];
            // srcSet format: "url1 650w, url2 1080w". The highest quality is the last one.
            const urls = srcSet.split(',');
            return urls[urls.length - 1].trim().split(' ')[0];
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}