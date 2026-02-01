import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Flashcard AI Learner',
    description: 'Learn languages with AI-generated flashcards and SM-2',
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Flashcard AI Learner",
    },
    formatDetection: {
        telephone: false,
    },
}

export const viewport = {
    themeColor: "#6366f1",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
