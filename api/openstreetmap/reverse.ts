export async function GET(request: Request) {
    const url = new URL(request.url);
    const result = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${url.searchParams.toString()}`,
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
