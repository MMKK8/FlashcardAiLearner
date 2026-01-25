'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, RotateCw, CheckCircle, Brain, X } from 'lucide-react';

export default function StudyPage() {
    const params = useParams();
    const router = useRouter();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (params.id) {
            fetchDueCards(params.id);
        }
    }, [params.id]);

    const fetchDueCards = async (deckId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const response = await axios.get(`${API_URL}/study/due?deck_id=${deckId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCards(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching cards:', error);
            setLoading(false);
        }
    };

    const handleGrade = async (quality) => {
        const currentCard = cards[currentIndex];

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/study/grade`,
                { card_id: currentCard.id, quality },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // If "Again" (1), re-queue the card for this session
            if (quality === 1) {
                setCards(prev => [...prev, currentCard]);
            }

            // Move to next card
            setReviewedCount(prev => prev + 1);
            setIsFlipped(false);

            // If we re-queued (quality === 1), we always proceed because we just added a card.
            // Otherwise, we only proceed if not at the last card.
            if (currentIndex < cards.length - 1 || quality === 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setSessionComplete(true);
            }

        } catch (error) {
            console.error('Error grading card:', error);
            alert('Failed to save progress. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (sessionComplete || cards.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md w-full text-center shadow-2xl">
                    <div className="bg-green-500/20 text-green-400 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">All Caught Up!</h1>
                    <p className="text-gray-400 mb-8">
                        {reviewedCount > 0
                            ? `You reviewed ${reviewedCount} card${reviewedCount !== 1 ? 's' : ''} today.`
                            : "No cards are due for review right now."}
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 md:p-8">
            {/* Header */}
            <div className="w-full max-w-3xl flex justify-between items-center mb-8">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft size={20} /> Exit
                </button>
                <div className="text-gray-400 font-medium bg-gray-800 px-4 py-1 rounded-full text-sm">
                    Card {currentIndex + 1} / {cards.length}
                </div>
            </div>

            {/* Card Container */}
            <div className="w-full max-w-3xl flex-1 flex flex-col relative perspective-1000">
                <div
                    className={`relative w-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 min-h-[400px] flex flex-col ${isFlipped ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                    {/* Front Content (Always Visible) */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center">
                        <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold mb-4">English</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{currentCard.word_en}</h2>

                        {/* Back Content (Revealed on Flip) */}
                        {isFlipped && (
                            <div className="w-full pt-8 mt-8 border-t border-gray-700 animate-fade-in">
                                <div className="mb-6">
                                    <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold block mb-2">Spanish</span>
                                    <h3 className="text-3xl md:text-4xl font-bold text-blue-400">{currentCard.word_es}</h3>
                                    <p className="text-gray-400 text-lg mt-2 font-mono">/{currentCard.phonetic || ''}/</p>
                                </div>

                                {currentCard.examples && currentCard.examples.length > 0 && (
                                    <div className="text-left bg-gray-750 p-6 rounded-xl bg-gray-900/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Brain size={16} className="text-purple-400" />
                                            <span className="text-gray-400 text-sm font-semibold uppercase">Examples</span>
                                        </div>
                                        <ul className="space-y-3">
                                            {currentCard.examples.map((ex, i) => (
                                                <li key={i} className="text-gray-300 italic flex gap-3">
                                                    <span className="text-gray-600 select-none">•</span>
                                                    <span>"{ex}"</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Bar (Pinned to Bottom) */}
                    {!isFlipped ? (
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/20"
                            >
                                Show Answer
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-800 border-t border-gray-700 grid grid-cols-4 gap-3">
                            <button
                                onClick={() => handleGrade(1)}
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors border border-red-900/50"
                            >
                                <span className="font-bold text-lg mb-1">Again</span>
                                <span className="text-xs opacity-70">&lt; 1 min</span>
                            </button>
                            <button
                                onClick={() => handleGrade(3)}
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-900/30 text-orange-400 hover:bg-orange-900/50 hover:text-orange-300 transition-colors border border-orange-900/50"
                            >
                                <span className="font-bold text-lg mb-1">Hard</span>
                                <span className="text-xs opacity-70">10 min</span>
                            </button>
                            <button
                                onClick={() => handleGrade(4)}
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300 transition-colors border border-blue-900/50"
                            >
                                <span className="font-bold text-lg mb-1">Good</span>
                                <span className="text-xs opacity-70">1 day</span>
                            </button>
                            <button
                                onClick={() => handleGrade(5)}
                                className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-900/30 text-green-400 hover:bg-green-900/50 hover:text-green-300 transition-colors border border-green-900/50"
                            >
                                <span className="font-bold text-lg mb-1">Easy</span>
                                <span className="text-xs opacity-70">4 days</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
