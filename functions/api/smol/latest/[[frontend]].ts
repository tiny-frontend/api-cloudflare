export const onRequest: PagesFunction = async (context) => {
  const { params, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": context.request.headers.get("Origin"),
    "Access-Control-Allow-Methods": "GET",
  };

  if (params.frontend.length !== 2) {
    return new Response("Invalid path parameters", {
      status: 400,
      headers: corsHeaders,
    });
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
      { status: 404, headers: corsHeaders }
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
        ...corsHeaders,
      },
    }
  );
};
