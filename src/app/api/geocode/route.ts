import { NextResponse } from "next/server";

export async function GET(req: Request) {
const { searchParams } = new URL(req.url);
const q = searchParams.get("q")?.trim();

if (!q) {
return NextResponse.json({ error: "Missing q" }, { status: 400 });
}

const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
q
)}`;

const res = await fetch(url, {
headers: {
"User-Agent": "beauty-reviewty/1.0 (contact: admin@example.com)",
Accept: "application/json",
},
});

if (!res.ok) {
return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
}

const data: Array<{
lat: string;
lon: string;
display_name: string;
}> = await res.json();

if (!data.length) {
return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const first = data[0];
return NextResponse.json({
name: first.display_name,
lat: Number(first.lat),
lng: Number(first.lon),
});
}
