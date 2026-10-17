Export default async function handler(req, res) {

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



// 4. Sweep the ENTIRE document (including JSON state) for ANY URL matching this specific Folder ID
        const fullRegex = new RegExp(`(https:\\/\\/[^"'\\s,\\>]+?\\/${mainFolderId}\\/[a-f0-9\\-]{36}[^"'\\s,\\>]*)`, 'gi');
        const matches = [...cleanHtml.matchAll(fullRegex)];

        if (matches.length === 0) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }

        // 5. Safely deduplicate by Image ID and strictly score by pixel width
        const getResolutionScore = (url) => {
            // Correctly captures the first width number whether it's _1080x.webp or _540x540.webp
            const sizeMatch = url.match(/_(\d+)x/i);
            if (sizeMatch) {
                return parseInt(sizeMatch[1], 10); // Accurately returns 1080, 540, etc.
            }
            
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes('original') || lowerUrl.includes('max')) return 99999;
            if (lowerUrl.includes('thumb') || lowerUrl.includes('placeholder')) return -1;
            
            // Unidentified formats get a baseline score so they don't override explicit high-res files
            return 0;
        };

        const uniqueImages = new Map();
        for (const match of matches) {
            const fullUrl = match[1];
            
            // Isolate the 36-character Image ID (handling underscores or direct extensions)
            const imageIdMatch = fullUrl.match(/\/([a-f0-9\-]{36})(?:_|\.)/i);
            
            if (imageIdMatch) {
                const imageId = imageIdMatch[1];
                const currentBest = uniqueImages.get(imageId);

                if (!currentBest) {
                    uniqueImages.set(imageId, fullUrl);
                } else {
                    const currentScore = getResolutionScore(currentBest);
                    const newScore = getResolutionScore(fullUrl);

                    // Only replace if the new URL provably has a higher pixel width
                    if (newScore > currentScore) {
                        uniqueImages.set(imageId, fullUrl);
                    }
                }
            }
        }

        const finalImages = Array.from(uniqueImages.values());

        if (finalImages.length === 0) {
            return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });
        }



const finalImages = Array.from(uniqueImages.values());



if (finalImages.length === 0) {

return res.status(404).json({ error: 'Error extracting photo. Make sure the post link is valid.' });

}



res.setHeader('Access-Control-Allow-Origin', '*');

res.status(200).json({ images: finalImages });

} catch (error) {

res.status(500).json({ error: 'Failed to scrape Vero link' });