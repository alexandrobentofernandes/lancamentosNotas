export const metadata = {
  title: 'CEO Cabo Frio — Sistema de Avaliações',
  description: 'Sistema de Avaliações HAR — CEO Cabo Frio 2026',
}

export const viewport = 'width=device-width, initial-scale=1, maximum-scale=1'

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.5.0/dist/tabler-icons.min.css"/>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"/>
      </head>
      <body style={{ margin: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#f5f5f0' }}>
        {children}
      </body>
    </html>
  )
}
