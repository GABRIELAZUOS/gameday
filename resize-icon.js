// Run this after placing icon.png in the public/ folder:
// node resize-icon.js

import sharp from 'sharp'
import { existsSync } from 'fs'

const src = './public/icon.png'

if (!existsSync(src)) {
  console.error('❌ Arquivo não encontrado: public/icon.png')
  console.error('   Coloque o arquivo icon.png dentro da pasta public/ e tente novamente.')
  process.exit(1)
}

for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`./public/icon-${size}.png`)
  console.log(`✅ Gerado: public/icon-${size}.png`)
}

console.log('\n🎉 Ícones prontos! Pode fazer o deploy.')
