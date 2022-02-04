interface TinyFrontendConfig {
  umdBundle: string;
  cssBundle?: string;
}

export const latestRoute = async (
  name: string,
  contractVersion: string,
  corsHeaders: Record<string, string>,
  TinyFrontendKv: KVNamespace
): Promise<Response> => {
  if (!name || !contractVersion) {
    return new Response("Invalid path parameters", {
      status: 400,
      ...corsHeaders,
    });
  }
  const latestConfigKey = `${name}-${contractVersion}-latest`;

  const latestConfigString = await TinyFrontendKv.get(latestConfigKey);

  if (latestConfigString == null) {
    return new Response(
      `${name} with contract version ${contractVersion} not found`,
      { status: 404, headers: corsHeaders }
    );
  }

  const latestConfig: TinyFrontendConfig = JSON.parse(latestConfigString);
  return new Response(JSON.stringify(latestConfig), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, max-age=0",
      ...corsHeaders,
    },
  });
};
