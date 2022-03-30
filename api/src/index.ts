import { bundleRoute } from "./routes/bundle";
import { latestRoute } from "./routes/latest";

addEventListener("fetch", async (event) => {
  try {
    const url = new URL(event.request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": event.request.headers.get(
        "Origin"
      ) as string,
      "Access-Control-Allow-Methods": "GET",
    };

    if (url.pathname.startsWith("/api/tiny")) {
      const afterTiny = url.pathname.replace("/api/tiny", "");
      if (afterTiny.startsWith("/bundle")) {
        event.respondWith(
          bundleRoute(afterTiny.replace("/bundle/", ""), corsHeaders)
        );
        return;
      }
      if (afterTiny.startsWith("/latest")) {
        const [name, contractVersion] = afterTiny
          .replace("/latest/", "")
          .split("/");
        event.respondWith(
          latestRoute(name, contractVersion, corsHeaders, TinyFrontendKv)
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
  const TinyFrontendKv: KVNamespace;
}
