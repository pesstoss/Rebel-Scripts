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

    // MATCHES VERO'S REACT STATE: "bio","Your bio text here"
    let bio = '';
    const bioMatch = html.match(/"bio"\s*,\s*"([^"]{2,})"/i) || html.match(/"bio"\s*:\s*"([^"]{2,})"/i);
    
    if (bioMatch && bioMatch[1]) {
      bio = bioMatch[1];
    }

    res.status(200).json({ name, bio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape' });
  }
}