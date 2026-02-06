import { NextRequest, NextResponse } from "next/server";

interface ReplicatePrediction {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { image, mask, prompt, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API-nøkkel mangler. Legg inn din Replicate API-nøkkel." },
        { status: 400 }
      );
    }

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: "Bilde, maske og prompt er påkrevd." },
        { status: 400 }
      );
    }

    // Create prediction
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "c11bac58203367db93a3c552bd49a25a5c84b50a20f1acd1a225f6c6e5e982f1",
        input: {
          prompt,
          image,
          mask,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 25,
        },
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => null);
      if (createRes.status === 401 || createRes.status === 403) {
        return NextResponse.json(
          { error: "Ugyldig API-nøkkel. Sjekk at nøkkelen din er korrekt." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error:
            errorData?.detail ||
            "Kunne ikke starte bildegenerering. Prøv igjen.",
        },
        { status: createRes.status }
      );
    }

    const prediction: ReplicatePrediction = await createRes.json();

    // Poll for result
    const pollUrl = `https://api.replicate.com/v1/predictions/${prediction.id}`;
    const maxAttempts = 60;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!pollRes.ok) {
        return NextResponse.json(
          { error: "Feil ved henting av resultat. Prøv igjen." },
          { status: 500 }
        );
      }

      const result: ReplicatePrediction = await pollRes.json();

      if (result.status === "succeeded" && result.output) {
        return NextResponse.json({ output: result.output[0] });
      }

      if (result.status === "failed") {
        return NextResponse.json(
          { error: result.error || "Bildegenerering feilet. Prøv igjen." },
          { status: 500 }
        );
      }

      if (result.status === "canceled") {
        return NextResponse.json(
          { error: "Bildegenerering ble avbrutt." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Tidsavbrudd – bildegenerering tok for lang tid." },
      { status: 504 }
    );
  } catch {
    return NextResponse.json(
      { error: "En uventet feil oppstod. Prøv igjen." },
      { status: 500 }
    );
  }
}
