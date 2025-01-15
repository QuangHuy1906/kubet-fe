import "./globals.css";
import { StreamProvider } from "../contexts/StreamContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StreamProvider>{children}</StreamProvider>
      </body>
    </html>
  );
}
