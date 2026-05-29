import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  // compress: true
};

export default nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   compress: true,
//   distDir: '.next',
//   // Отключаем HTTP/2, принудительно используем HTTP/1.1
//   httpAgentOptions: {
//     keepAlive: false,
//   },
//   // Добавляем заголовки для совместимости
//   async headers() {
//     return [
//       {
//         source: '/:path*',
//         headers: [
//           {
//             key: 'Connection',
//             value: 'close',
//           },
//         ],
//       },
//     ];
//   },
// };


// export default nextConfig;
