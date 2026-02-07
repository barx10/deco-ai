import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image, mask, prompt, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API-nøkkel mangler. Legg inn din Google AI API-nøkkel." },
        { status: 400 }
      );
    }

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: "Bilde, maske og prompt er påkrevd." },
        { status: 400 }
      );
    }

    // Strip data URL prefix to get raw base64
    const imageBase64 = image.replace(/^data:image\/\w+;base64,/, "");
    const maskBase64 = mask.replace(/^data:image\/\w+;base64,/, "");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-capability-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [
            {
              prompt,
              referenceImages: [
                {
                  referenceType: "REFERENCE_TYPE_RAW",
                  referenceId: 1,
                  referenceImage: {
                    bytesBase64Encoded: imageBase64,
                  },
                },
                {
                  referenceType: "REFERENCE_TYPE_MASK",
                  referenceId: 2,
                  referenceImage: {
                    bytesBase64Encoded: maskBase64,
                  },
                  maskImageConfig: {
                    maskMode: "MASK_MODE_USER_PROVIDED",
                    dilation: 0.01,
                  },
                },
              ],
            },
          ],
          parameters: {
            editMode: "EDIT_MODE_INPAINT_INSERTION",
            sampleCount: 1,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          {
            error:
              "Ugyldig API-nøkkel. Sjekk at nøkkelen din er korrekt og at Imagen API er aktivert.",
          },
          { status: 401 }
        );
      }
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Rate limit nådd. Vent litt og prøv igjen." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error:
            errorData?.error?.message ||
            "Kunne ikke generere bilde. Prøv igjen.",
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (data.predictions && data.predictions.length > 0) {
      const base64Result = data.predictions[0].bytesBase64Encoded;
      const mimeType = data.predictions[0].mimeType || "image/png";
      return NextResponse.json({
        output: `data:${mimeType};base64,${base64Result}`,
      });
    }

    return NextResponse.json(
      { error: "Ingen bilder i resultatet fra Google." },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: "En uventet feil oppstod. Prøv igjen." },
      { status: 500 }
    );
  }
}
