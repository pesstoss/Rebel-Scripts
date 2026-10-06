export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    // Fetch the Vero profile page.
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();

    let name = '';
    const ogMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

    if (ogMatch && ogMatch[1]) {
      name = ogMatch[1];
    } else if (titleMatch && titleMatch[1]) {
      name = titleMatch[1];
    }

    // Clean up the scraped name by removing " on VERO" and the "™" symbol
    name = name.replace(' on VERO', '').replace('™', '').trim();

    res.status(200).json({ name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape' });
  }
}
