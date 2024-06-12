export async function GET(request: Request) {
    const url = new URL(request.url);
    const place = url.searchParams.get('place') ?? '';
    const result = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            place.toLowerCase()
        )}&format=geojson&limit=5&polygon_geojson=1`,
        {
            headers: {
                'User-Agent': 'geo-guess-do/1.0000',
            },
        }
    );

    return new Response(await result.text(), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
