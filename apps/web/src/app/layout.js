"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("@/styles/globals.css");
const inter = (0, google_1.Inter)({
    subsets: ['latin', 'cyrillic'],
    display: 'swap',
});
exports.metadata = {
    title: 'Город Приключений | Adventure City',
    description: 'Городские игры нового поколения. Создавай и проходи квесты в своём городе.',
    openGraph: {
        title: 'Город Приключений',
    },
    keywords: ['квесты', 'городские игры', 'Adventure Engine', 'командные игры'],
    icons: {
        icon: '/images/logo/favicon.png',
        apple: '/images/logo/favicon.png',
    },
};
function RootLayout({ children, }) {
    return (<html lang="ru" className={inter.className}>
      <head>
        <meta name="theme-color" content="#0F1117"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </head>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <main>{children}</main>
      </body>
    </html>);
}
//# sourceMappingURL=layout.js.map