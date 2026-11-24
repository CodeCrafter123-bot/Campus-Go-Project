import "./globals.css";

export const metadata = {
  title: "CampusGo API",
  description: "Backend for the CampusGo campus delivery app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
