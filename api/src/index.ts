import { bundleRoute } from "./routes/bundle";
import { latestRoute } from "./routes/latest";

addEventListener("fetch", async (event) => {
  try {
    const url = new URL(event.request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": event.request.headers.get("Origin"),
      "Access-Control-Allow-Methods": "GET",
    };

    if (url.pathname.startsWith("/api/smol")) {
      const afterSmol = url.pathname.replace("/api/smol", "");
      if (afterSmol.startsWith("/bundle")) {
        event.respondWith(
          bundleRoute(afterSmol.replace("/bundle/", ""), corsHeaders)
        );
        return;
      }
      if (afterSmol.startsWith("/latest")) {
        const [name, contractVersion] = afterSmol
          .replace("/latest/", "")
          .split("/");
        event.respondWith(
          latestRoute(name, contractVersion, corsHeaders, SmolFrontendKv)
        );
        return;
      }
    }

    event.respondWith(
      new Response("Not found.", { status: 404, ...corsHeaders })
    );
  } catch (err) {
    console.error("There was an error!");
    console.error(err);
    event.respondWith(new Response("Error.", { status: 500 }));
  }
});

declare global {
  const SmolFrontendKv: KVNamespace;
}
