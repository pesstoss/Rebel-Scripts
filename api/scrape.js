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

    // Strip Vero suffixes, actions, and special characters
    name = name
      .replace(/(\s+shared\s+(a\s+)?(photo|post|video|image|link).*)/i, '')
      .replace(/\s+on\s+VERO.*$/i, '')
      .replace(/[™®]/g, '')
      .trim();

    // NEW: Extract the bio from Vero's internal state array
    let bio = '';
    const bioMatch = html.match(/"bio","(.*?)"/i);
    if (bioMatch && bioMatch[1]) {
      bio = bioMatch[1];
    }

    // Return both the cleaned name and the raw bio string
    res.status(200).json({ name, bio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape' });
  }
}