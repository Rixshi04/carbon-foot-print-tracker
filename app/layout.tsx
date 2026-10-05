import "./globals.css";

export const metadata = {
  title: "Carbon Footprint Tracker",
  description: "Estimate household and travel carbon emissions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
