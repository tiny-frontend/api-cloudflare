import * as fs from "fs/promises";
import fetch from "node-fetch";

interface DeployOptionsCloudflareAuth {
  accountIdentifier: string;
  apiToken: string;
  kvNamespaceIdentifier: string;
}

interface DeployOptions {
  cloudflare: DeployOptionsCloudflareAuth;
  name: string;
  contractVersion: string;
  umdBundlePath: string;
  cssBundlePath?: string;
  previousBundleTtlInSeconds?: number;
}

interface TinyFrontendConfig {
  umdBundle: string;
  cssBundle?: string;
}

const ONE_MONTH_IN_SECONDS = 31 * 24 * 60 * 60;

export const deployBundle = async ({
  cloudflare,
  name,
  contractVersion,
  umdBundlePath,
  cssBundlePath,
  previousBundleTtlInSeconds = ONE_MONTH_IN_SECONDS,
}: DeployOptions) => {
  console.log(
    `➡️ ☁️ Deploying ${name} with contract version ${contractVersion} on KV namespace ${cloudflare.kvNamespaceIdentifier}`
  );

  const latestConfigKey = `${name}-${contractVersion}-latest`;

  const umdBundleSource = await fs.readFile(umdBundlePath);
  const cssBundleSource = cssBundlePath
    ? await fs.readFile(cssBundlePath)
    : undefined;

  console.log("💻 Read bundle from disk");

  const now = Date.now();
  const newReleaseUmdBundleKey = `${name}-${contractVersion}-${now}-umd.js`;
  const newReleaseCssBundleKey = cssBundlePath
    ? `${name}-${contractVersion}-${now}.css`
    : undefined;

  // Upload new release source to KV
  await putKV(cloudflare, newReleaseUmdBundleKey, umdBundleSource.toString());
  if (newReleaseCssBundleKey && cssBundleSource) {
    await putKV(cloudflare, newReleaseCssBundleKey, cssBundleSource.toString());
  }

  console.log("🌤 Uploaded bundle to Cloudflare");

  // Get previous config
  const previousLatestConfigString = await getKV(cloudflare, latestConfigKey);

  // Update the latest config
  const newLatestConfig: TinyFrontendConfig = {
    umdBundle: newReleaseUmdBundleKey,
    cssBundle: newReleaseCssBundleKey,
  };
  await putKV(cloudflare, latestConfigKey, JSON.stringify(newLatestConfig));

  console.log("🌤 Updated config on Cloudflare to point to new bundles");

  // Set previous latest release source to expire
  if (previousLatestConfigString !== null) {
    const previousLatestConfig = JSON.parse(
      previousLatestConfigString
    ) as TinyFrontendConfig;

    await updateExistingKvTtl(
      cloudflare,
      previousLatestConfig.umdBundle,
      previousBundleTtlInSeconds
    );
    if (previousLatestConfig.cssBundle) {
      await updateExistingKvTtl(
        cloudflare,
        previousLatestConfig.cssBundle,
        previousBundleTtlInSeconds
      );
    }

    console.log("👴 Set previous bundles to expire");
  }

  console.log("\n✅ Deployed successfully");
};

const updateExistingKvTtl = async (
  cloudflare: DeployOptionsCloudflareAuth,
  key: string,
  ttlInSeconds: number
) => {
  const previousValue = await getKV(cloudflare, key);
  if (!previousValue) {
    console.error(
      `Couldn't find previous value for key ${key} when trying to update ttl`
    );
    return;
  }

  await putKV(cloudflare, key, previousValue, ttlInSeconds);
};

const getKVBasePath = (cloudflare: DeployOptionsCloudflareAuth) =>
  `https://api.cloudflare.com/client/v4/accounts/${cloudflare.accountIdentifier}/storage/kv/namespaces/${cloudflare.kvNamespaceIdentifier}/values`;

async function putKV(
  cloudflare: DeployOptionsCloudflareAuth,
  key: string,
  value: string,
  ttlInSeconds?: number
) {
  const response = await fetch(
    `${getKVBasePath(cloudflare)}/${key}${
      ttlInSeconds ? `?expiration_ttl=${ttlInSeconds}` : ""
    }`,
    {
      body: value,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cloudflare.apiToken}`,
      },
    }
  );

  if (response.status >= 400) {
    console.error(await response.text());
    throw new Error(`Error while putting key in KV: ${key}`);
  }
}

async function getKV(
  cloudflare: DeployOptionsCloudflareAuth,
  key: string
): Promise<string | null> {
  const response = await fetch(`${getKVBasePath(cloudflare)}/${key}`, {
    headers: {
      Authorization: `Bearer ${cloudflare.apiToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status >= 400) {
    console.error(await response.text());
    throw new Error(`Error while getting key in KV: ${key}`);
  }

  return await response.text();
}
