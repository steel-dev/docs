// ABOUTME: Thin wrapper around the OpenAI image API used to generate the card background.
// ABOUTME: Returns raw PNG bytes for one image.
import OpenAI from 'openai';

export const IMAGE_MODEL = 'gpt-image-2';

export type GenerateBackgroundOptions = {
  prompt: string;
  /** Pixel size of the generated image, e.g. "1536x1024". */
  size: string;
  apiKey?: string;
};

/** Generates one background image and returns its PNG bytes. */
export async function generateBackground({
  prompt,
  size,
  apiKey = process.env.OPENAI_API_KEY,
}: GenerateBackgroundOptions): Promise<Buffer> {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set — export it or pass --background <path>');
  }

  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({
    model: IMAGE_MODEL,
    prompt,
    size: size as never,
    n: 1,
    output_format: 'png',
  });

  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) throw new Error(`${IMAGE_MODEL} returned no image data`);

  return Buffer.from(encoded, 'base64');
}
