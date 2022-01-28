interface SmolFrontendConfig {
  umdBundle: string;
  cssBundle?: string;
}

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
  const latestConfigKey = `${name}-${contractVersion}-latest`;

  const latestConfigString = await SmolFrontendKv.get(latestConfigKey);

  if (latestConfigString == null) {
    return new Response(
      `${name} with contract version ${contractVersion} not found`,
      { status: 404, headers: corsHeaders }
    );
  }

  const latestConfig: SmolFrontendConfig = JSON.parse(latestConfigString);
  return new Response(JSON.stringify(latestConfig), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, max-age=0",
      ...corsHeaders,
    },
  });
};
