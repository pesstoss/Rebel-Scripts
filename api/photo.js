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
        const html = await postReq.text();

        // og:image = folder + first photo
        const og = html.match(/property="og:image" content="https:\/\/[^/]+\/([0-9a-f-]{36})\/([0-9a-f-]{36})_/i);
        if (!og) return res.status(404).json({ error: 'No og:image found' });
        const [, folder, anchor] = og;

        // every id in this folder, with its position in the page
        const re = new RegExp(folder + '/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', 'g');
        const hits = [...html.matchAll(re)].map(m => ({ id: m[1], pos: m.index }));

        // group ids that sit close together
        const clusters = [];
        for (const h of hits) {
            const last = clusters[clusters.length - 1];
            if (last && h.pos - last.end < 800) { last.hits.push(h); last.end = h.pos; }
            else clusters.push({ hits: [h], end: h.pos });
        }
        const groups = clusters.map(c => [...new Set(c.hits.map(h => h.id))]);

        // the post = the biggest group containing the first photo
        const ids = groups
            .filter(g => g.includes(anchor))
            .sort((a, b) => b.length - a.length)[0] || [anchor];

        const finalImages = ids.map(id => `https://d1dpu3msttfsqg.cloudfront.net/${folder}/${id}`);

        if (req.query.debug) return res.status(200).json({ folder, anchor, groups, finalImages });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ images: finalImages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape Vero link' });
    }
}