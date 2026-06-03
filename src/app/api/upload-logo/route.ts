import fs from 'fs';
import path from 'path';

const SUPPORTED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export async function POST(req: Request) {
  const formData = await req.formData();
  const uploadedFile = formData.get('logo');

  if (!uploadedFile || !(uploadedFile instanceof File)) {
    return new Response(JSON.stringify({ error: 'Missing logo file.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const contentType = uploadedFile.type;
  const extension = SUPPORTED_IMAGE_TYPES[contentType];
  if (!extension) {
    return new Response(JSON.stringify({ error: 'Unsupported image type. Upload PNG, JPG, WEBP, or SVG.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const publicDir = path.join(process.cwd(), 'public');
  await fs.promises.mkdir(publicDir, { recursive: true });

  const logoFileName = `logo.${extension}`;
  const logoPath = path.join(publicDir, logoFileName);
  const logoBuffer = Buffer.from(await uploadedFile.arrayBuffer());
  await fs.promises.writeFile(logoPath, logoBuffer);

  await Promise.all(
    Object.values(SUPPORTED_IMAGE_TYPES)
      .map((ext) => path.join(publicDir, `logo.${ext}`))
      .filter((candidatePath) => candidatePath !== logoPath)
      .map(async (candidatePath) => {
        try {
          await fs.promises.unlink(candidatePath);
        } catch {
          // ignore missing files
        }
      })
  );

  return new Response(JSON.stringify({ ok: true, url: `/${logoFileName}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
