import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");
  const region = searchParams.get("region") || "west";
  const qualities = searchParams.get("qualities") || "1,2,3,4,5";

  if (!itemId) {
    return NextResponse.json(
      { error: "O parâmetro itemId é obrigatório." },
      { status: 400 }
    );
  }

  // Mapeia regiões para seus respectivos hosts do AODP
  const hosts: Record<string, string> = {
    west: "https://west.albion-online-data.com",
    east: "https://east.albion-online-data.com",
    europe: "https://europe.albion-online-data.com",
  };

  const host = hosts[region.toLowerCase()] || hosts.west;
  const locations = "Lymhurst,Martlock,Bridgewatch,FortSterling,Thetford,Caerleon,Brecilien";
  
  const targetUrl = `${host}/api/v2/stats/prices/${itemId}?locations=${locations}&qualities=${qualities}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
      next: { revalidate: 60 }, // Cache por 60 segundos
    });

    if (!res.ok) {
      throw new Error(`AODP respondeu com status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no proxy de preços:", error);
    return NextResponse.json(
      { error: "Falha ao consultar preços no Albion Online Data Project." },
      { status: 500 }
    );
  }
}
