const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const onRequest: PagesFunction = async (context) => {
  const { params, env } = context;

  const bundleName = params.bundleName as string | null;
  if (!bundleName) {
    return new Response("Invalid path parameters", { status: 400 });
  }

  const SmolFrontendKv = (env as unknown as Record<string, KVNamespace>)[
    "SmolFrontendKv"
  ];

  const latestVersionSource = await SmolFrontendKv.get(bundleName);
  if (latestVersionSource == null) {
    return new Response(`Bundle ${bundleName} not found`, { status: 404 });
  }

  return new Response(latestVersionSource, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": `public, max-age=${ONE_WEEK_IN_SECONDS}`,
    },
  });
};
