export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();

    let name = '';
    const ogMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    if (ogMatch && ogMatch[1]) {
      name = ogMatch[1];
    }
    
    name = name
      .replace(/(\s+shared\s+(a\s+)?(photo|post|video|image|link).*)/i, '')
      .replace(/\s+on\s+VERO.*$/i, '')
      .replace(/[™®]/g, '')
      .trim();

    // SUPER FLEXIBLE REGEX: Finds "bio", skips any formatting characters, and grabs the text string inside quotes
    let bio = '';
    const bioRegex = /"bio"\s*[:,\,]\s*"([^"]{2,})"|<meta[^>]*name="description"[^>]*content="([^"]+)"/i;
    const match = html.match(bioRegex);
    
    if (match) {
      bio = match[1] || match[2] || '';
    }

    res.status(200).json({ name, bio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape' });
  }
}