export async function GET(request: Request) {
    const url = new URL(request.url);
    const osmId = url.searchParams.get('osmId');
    const result = await fetch(
        `https://nominatim.openstreetmap.org/lookup?osm_ids=R${osmId}&format=geojson&polygon_geojson=1&accept-language=en`,
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
