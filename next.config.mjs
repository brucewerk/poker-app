// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🔥 Remova 'swcMinify' - não é mais necessário no Next.js 16

  // 🔥 Configuração de imagens (se precisar)
  images: {
    domains: ["localhost"],
  },

  // 🔥 Se precisar de redirects, use com 'destination'
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       has: [
  //         {
  //           type: 'cookie',
  //           key: 'next-auth.session-token',
  //         },
  //       ],
  //       destination: '/dashboard', // ← Adicione um destino válido
  //       permanent: false,
  //     },
  //   ];
  // },
};

export default nextConfig;
