const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const bundleRoute = async (
  bundleName: string,
  corsHeaders: Record<string, string>
): Promise<Response> => {
  if (!bundleName) {
    return new Response("Invalid path parameters", {
      status: 400,
      ...corsHeaders,
    });
  }

  const latestVersionSource = await TinyFrontendKv.get(bundleName);
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
      "Content-Type": contentTypeForExtension[extension as "css" | "js"],
      "Cache-Control": `public, max-age=${ONE_WEEK_IN_SECONDS}`,
      ...corsHeaders,
    },
  });
};

const contentTypeForExtension = {
  js: "application/javascript",
  css: "text/css",
};
