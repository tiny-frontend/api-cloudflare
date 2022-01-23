export async function onRequest(context) {
  const { params } = context;

  if (params.frontend.length !== 2) {
    return new Response("Invalid path parameters", { status: 400 });
  }

  const [frontendName, contractVersion] = params.frontend;

  return new Response(`${frontendName} ${contractVersion}`);
}
