import "./globals.css";

export const metadata = {
  title: "Lane Law AI — Ask India's Motor Vehicles Act",
  description:
    "Ask traffic-law questions for bikes and cars. Answers come only from the Motor Vehicles Act 1988, the Driving Regulations 2017 and MoRTH's 2019 revised penalties — with every source shown.",
};

export const viewport = { themeColor: "#050607" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
