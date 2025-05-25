import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});



// -------------------------------------------------------------
// Zod schema for the vision-model JSON structure
// -------------------------------------------------------------
const ChildAttributeSchema = z.object({
  age: z.string(),
  hair_style: z.string(),
  headwear: z.string(),
  eyewear: z.string(),
  clothing: z.string(),
  pose: z.string(),
  main_object: z.string()
});
type ChildAttributes = z.infer<typeof ChildAttributeSchema>;

// -------------------------------------------------------------
// analyseImageWithVision — strict JSON return, no markdown noise
// -------------------------------------------------------------
async function analyseImageWithVision(
  imageUrl: string,
  userPrompt?: string
): Promise<ChildAttributes> {
  const prompt = userPrompt ?? `Analyse this photo and extract key features for creating a colouring‑book page. ` +
    `Return JSON ONLY with these exact keys (use "none" if absent):\n` +
    JSON.stringify({
      age: 'young child / toddler / school age',
      hair_style: 'e.g. short curly hair, long straight hair',
      headwear: 'e.g. baseball cap, headband, none',
      eyewear: 'e.g. round sunglasses, glasses, none',
      clothing: 'e.g. t‑shirt and shorts, dress with sleeves',
      pose: 'e.g. standing with arms raised, sitting cross‑legged',
      main_object: 'e.g. toy car, ball, none'
    }, null, 2);

  // Build the chat payload with enforced system instruction
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    messages: [
      {
        role: 'system',
        content: 'You are an image analyst. Respond ONLY with strict JSON, no markdown or extra text.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  const content = response.choices[0]?.message?.content ?? '{}';

  // Validate & parse; throw early if the model violated the contract
  const parsed = (() => {
    try {
      return ChildAttributeSchema.parse(JSON.parse(content));
    } catch (err) {
      console.error('[analyseImageWithVision] invalid JSON from vision model', err, '\nRaw content:\n', content);
      throw new Error('Vision model returned invalid JSON');
    }
  })();

  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const analysis = await analyseImageWithVision(imageUrl);

    return NextResponse.json({
      analysis,
      attributes: analysis
    });

  } catch (error) {
    console.error('Image analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}