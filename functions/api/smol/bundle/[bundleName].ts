const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const onRequest: PagesFunction = async (context) => {
  const { params, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": context.request.headers.get("Origin"),
    "Access-Control-Allow-Methods": "GET",
  };

  const bundleName = params.bundleName as string | null;
  if (!bundleName) {
    return new Response("Invalid path parameters", {
      status: 400,
      ...corsHeaders,
    });
  }

  const SmolFrontendKv = (env as unknown as Record<string, KVNamespace>)[
    "SmolFrontendKv"
  ];

  const latestVersionSource = await SmolFrontendKv.get(bundleName);
  if (latestVersionSource == null) {
    return new Response(`Bundle ${bundleName} not found`, {
      status: 404,
      ...corsHeaders,
    });
  }

  const bundleNameSplit = bundleName.split(".");
  const extension = bundleNameSplit[bundleNameSplit.length - 1];

  return new Response(latestVersionSource, {
    headers: {
      "Content-Type": contentTypeForExtension[extension],
      "Cache-Control": `public, max-age=${ONE_WEEK_IN_SECONDS}`,
      ...corsHeaders,
    },
  });
};

const contentTypeForExtension = {
  js: "application/javascript",
  css: "text/css",
};
