// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react({
//       babel: {
//         plugins: [['babel-plugin-react-compiler']],
//       },
//     }),
//   ],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No need to import or use tailwindcss() here!
export default defineConfig({
  plugins: [react()],
})