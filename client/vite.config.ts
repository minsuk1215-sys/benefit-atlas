import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3300,        // 고정 포트
    strictPort: true,  // 이 포트가 막혔으면 다른 포트로 옮기지 말고 에러를 띄움
  },
})