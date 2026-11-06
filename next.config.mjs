/** @type {import('next').NextConfig} */
// STATIC_EXPORT=1 builds a plain static site (used for GitHub Pages).
// NEXT_PUBLIC_BASE_PATH sets the sub path, e.g. "/vrooma" for https://<user>.github.io/vrooma/.
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isStatic
    ? { output: "export", trailingSlash: true, images: { unoptimized: true }, basePath: basePath || undefined }
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
              ],
            },
          ];
        },
      }),
};
export default nextConfig;
