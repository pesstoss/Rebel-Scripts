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

    // Let's search for "bio" in the text or return a preview of what html length we got
    let bio = '';
    const bioMatch = html.match(/"bio"\s*,\s*"([^"]+)"/i) || html.match(/"bio"\s*:\s*"([^"]+)"/i);
    
    if (bioMatch && bioMatch[1]) {
      bio = bioMatch[1];
    } else {
      // DEBUG: If no bio found, return part of the HTML text length so we know if it blocked us
      bio = `HTML Length: ${html.length} | Contains bio string: ${html.includes('bio')}`;
    }

    res.status(200).json({ name, bio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape' });
  }
}