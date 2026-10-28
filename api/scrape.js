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

    // ULTRA-FLEXIBLE BIO EXTRACTION: Handles internal escaped quotes and line breaks safely
    let bio = '';
    const patterns = [
      /"bio"\s*,\s*"((?:\\.|[^"\\])*)"/i,
      /"bio"\s*:\s*"((?:\\.|[^"\\])*)"/i,
      /\\"bio\\"\s*,\s*\\?"((?:\\.|[^"\\])*)\\?"/i,
      /<meta[^>]*name="description"[^>]*content="([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        bio = match[1]
          .replace(/\\n/g, ' ')
          .replace(/\\"/g, '"')
          .trim();
        break;
      }
    }

    res.status(200).json({ name, bio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape' });
  }
}