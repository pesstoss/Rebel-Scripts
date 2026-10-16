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

        // 1. FAST COUNT: Split by the exact dot string. 2 dots = split array of 3. Minus 1 gives us exactly 2 images.
        const dotsCount = cleanHtml.split('data-dot="true"').length - 1;
        const imageCount = Math.max(1, dotsCount);

        // 2. RAW SPLIT: Break the entire document into chunks starting with <picture>. No regex required.
        const pictures = cleanHtml.split('<picture>');
        if (pictures.length < 2) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }
        pictures.shift(); // Throw away the header/metadata chunk before the first picture tag

        // 3. EXTRACT URLs: Process just the short chunks to find the srcSet string safely
        const extractedUrls = [];
        for (const pic of pictures) {
            const srcSetMatch = pic.match(/srcSet=["']([^"']+)["']/i);
            if (srcSetMatch) {
                const srcSet = srcSetMatch[1];
                // Split the srcSet by commas to separate resolutions, grab the final one (highest quality)
                const urls = srcSet.split(',').map(s => s.trim().split(' ')[0]);
                extractedUrls.push(urls[urls.length - 1]);
            }
        }

        // 4. SAFETY NET: If the avatar or grid thumbs somehow used a <picture> tag, they will be 150x or 250x. Filter them out.
        const highResUrls = extractedUrls.filter(u => !u.includes('_150x') && !u.includes('_250x') && !u.includes('avatar'));

        // 5. SLICE: Keep exactly the number of images we counted. The bottom grid is automatically thrown away.
        const finalImages = highResUrls.slice(0, imageCount);

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'Error extracting photos. Make sure the post link is valid.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}