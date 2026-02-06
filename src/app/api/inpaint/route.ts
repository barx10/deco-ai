import { NextRequest, NextResponse } from "next/server";

type Provider = "replicate" | "fal";

interface ReplicatePrediction {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

async function handleReplicate(
  image: string,
  mask: string,
  prompt: string,
  apiKey: string
): Promise<NextResponse> {
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
    if (createRes.status === 429) {
      return NextResponse.json(
        {
          error:
            "Rate limit nådd hos Replicate. Vent litt og prøv igjen, eller bytt til FAL.ai.",
        },
        { status: 429 }
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
}

async function handleFal(
  image: string,
  mask: string,
  prompt: string,
  apiKey: string
): Promise<NextResponse> {
  // Submit request
  const submitRes = await fetch(
    "https://queue.fal.run/fal-ai/stable-diffusion-inpainting",
    {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_url: image,
        mask_url: mask,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        strength: 0.99,
      }),
    }
  );

  if (!submitRes.ok) {
    const errorData = await submitRes.json().catch(() => null);
    if (submitRes.status === 401 || submitRes.status === 403) {
      return NextResponse.json(
        {
          error:
            "Ugyldig FAL API-nøkkel. Sjekk at nøkkelen din er korrekt.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        error:
          errorData?.detail ||
          "Kunne ikke starte bildegenerering. Prøv igjen.",
      },
      { status: submitRes.status }
    );
  }

  const submitData = await submitRes.json();

  // If we got a direct result (synchronous response)
  if (submitData.images) {
    return NextResponse.json({ output: submitData.images[0].url });
  }

  // Poll for async result
  const requestId = submitData.request_id;
  if (!requestId) {
    return NextResponse.json(
      { error: "Uventet svar fra FAL API." },
      { status: 500 }
    );
  }

  const statusUrl = `https://queue.fal.run/fal-ai/stable-diffusion-inpainting/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/fal-ai/stable-diffusion-inpainting/requests/${requestId}`;
  const maxAttempts = 60;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${apiKey}` },
    });

    if (!statusRes.ok) {
      return NextResponse.json(
        { error: "Feil ved henting av status. Prøv igjen." },
        { status: 500 }
      );
    }

    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") {
      // Fetch the result
      const resultRes = await fetch(resultUrl, {
        headers: { Authorization: `Key ${apiKey}` },
      });

      if (!resultRes.ok) {
        return NextResponse.json(
          { error: "Feil ved henting av resultat. Prøv igjen." },
          { status: 500 }
        );
      }

      const resultData = await resultRes.json();
      if (resultData.images && resultData.images.length > 0) {
        return NextResponse.json({ output: resultData.images[0].url });
      }

      return NextResponse.json(
        { error: "Ingen bilder i resultatet." },
        { status: 500 }
      );
    }

    if (statusData.status === "FAILED") {
      return NextResponse.json(
        { error: "Bildegenerering feilet hos FAL. Prøv igjen." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Tidsavbrudd – bildegenerering tok for lang tid." },
    { status: 504 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { image, mask, prompt, apiKey, provider = "fal" } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API-nøkkel mangler." },
        { status: 400 }
      );
    }

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: "Bilde, maske og prompt er påkrevd." },
        { status: 400 }
      );
    }

    const selectedProvider: Provider = provider === "replicate" ? "replicate" : "fal";

    if (selectedProvider === "replicate") {
      return await handleReplicate(image, mask, prompt, apiKey);
    } else {
      return await handleFal(image, mask, prompt, apiKey);
    }
  } catch {
    return NextResponse.json(
      { error: "En uventet feil oppstod. Prøv igjen." },
      { status: 500 }
    );
  }
}
