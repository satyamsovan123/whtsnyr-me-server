export async function getNearbyRestaurants(lat, lng) {
  const url = `https://www.swiggy.com/dapi/restaurants/list/v5?lat=${lat}&lng=${lng}&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });
  if (!response.ok) throw new Error("Failed to fetch from Swiggy API");
  return response.json();
}
