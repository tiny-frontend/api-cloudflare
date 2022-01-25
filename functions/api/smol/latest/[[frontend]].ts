export const onRequest: PagesFunction = async (context) => {
  const { params, env } = context;

  if (params.frontend.length !== 2) {
    return new Response("Invalid path parameters", { status: 400 });
  }

  const SmolFrontendKv = (env as unknown as Record<string, KVNamespace>)[
    "SmolFrontendKv"
  ];

  const [name, contractVersion] = params.frontend;
  const latestVersionPointerKey = `${name}-${contractVersion}-latest`;

  const latestVersionSourceKey = await SmolFrontendKv.get(
    latestVersionPointerKey
  );

  if (latestVersionSourceKey == null) {
    return new Response(
      `${name} with contract version ${contractVersion} not found`,
      { status: 404 }
    );
  }

  return new Response(
    JSON.stringify({
      umdBundle: latestVersionSourceKey,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, max-age=0",
      },
    }
  );
};
