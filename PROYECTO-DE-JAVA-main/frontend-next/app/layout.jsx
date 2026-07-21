import "./globals.css";

export const metadata = {
  title: "Estado de Consultas",
  description: "Consulta publica del estado de solicitudes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
