export default function manifest() {
    return {
        name: 'VestaLedger',
        short_name: 'VestaLedger',
        description: 'Smart Personal Expense Tracker & Financial Manager',
        start_url: '/',
        display: 'standalone',
        background_color: '#06080d',
        theme_color: '#00e5a0',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
