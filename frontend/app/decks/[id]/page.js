'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus, PlayCircle, Download, Camera } from 'lucide-react';

export default function DeckDetail() {
    const params = useParams(); // { id }
    const router = useRouter();

    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    // Card Generation State
    const [newWord, setNewWord] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    // OCR State
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchDeckAndCards();
    }, [params.id]);

    const fetchDeckAndCards = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            // Parallel fetch
            const [deckRes, cardsRes] = await Promise.all([
                axios.get(`${API_URL}/decks/${params.id}`, { headers }),
                axios.get(`${API_URL}/cards/${params.id}`, { headers })
            ]);

            setDeck(deckRes.data);
            setCards(cardsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load deck data');
            setLoading(false);
        }
    };

    const handleGenerateCard = async (e) => {
        e.preventDefault();
        if (!newWord.trim()) return;

        setIsGenerating(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/cards/generate`,
                { word: newWord, deck_id: params.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCards([response.data, ...cards]);
            setNewWord('');
        } catch (error) {
            console.error('Generation error:', error);
            setError('Failed to generate card using AI. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageTrigger = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/cards/ocr`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.word) {
                setNewWord(response.data.word);
            }
        } catch (error) {
            console.error('OCR error:', error);
            setError('Failed to extract text from image.');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/decks/${params.id}/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' // Important for downloading files
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${deck.name.replace(/\s+/g, '_')}_export.json`); // Filename
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export deck');
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center items-center">Loading...</div>;
    if (!deck) return <div className="min-h-screen bg-gray-900 text-white p-8">Deck not found</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>

                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                {deck.name}
                            </h1>
                            <p className="text-gray-400 mt-2">{cards.length} cards in this deck</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center transition-colors border border-gray-600"
                            >
                                <Download className="mr-2" size={20} /> Export JSON
                            </button>
                            <button
                                onClick={() => router.push(`/study/${params.id}`)}
                                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold flex items-center shadow-lg hover:shadow-green-500/20 transition-all border border-green-500"
                            >
                                <PlayCircle className="mr-2" /> Study Now
                            </button>
                        </div>
                    </div>
                </header>

                {/* AI Generator Input */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl mb-10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Sparkles className="text-yellow-400 mr-2" />
                        Add New Card (AI Powered)
                    </h2>

                    <form onSubmit={handleGenerateCard} className="flex gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleImageTrigger}
                            disabled={isGenerating || isUploading}
                            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg border border-gray-600 transition-colors flex items-center justify-center min-w-[50px]"
                            title="Take a photo"
                        >
                            {isUploading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Camera size={24} />
                            )}
                        </button>
                        <input
                            type="text"
                            placeholder="Type a word in English... (e.g. 'Serendipity')"
                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            disabled={isGenerating}
                        />
                        <button
                            type="submit"
                            disabled={isGenerating || !newWord.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center transition-colors min-w-[160px] justify-center"
                        >
                            {isGenerating ? (
                                <span className="animate-pulse">Generating...</span>
                            ) : (
                                <>
                                    <Plus className="mr-2" size={20} /> Generate
                                </>
                            )}
                        </button>
                    </form>
                    {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
                </div>

                {/* Cards List */}
                <div className="grid gap-4">
                    {cards.map((card) => (
                        <div key={card.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="w-1/3">
                                    <h3 className="text-xl font-bold text-white mb-1">{card.word_en}</h3>
                                    <span className="text-sm text-gray-400 font-mono bg-gray-900 px-2 py-0.5 rounded">
                                        {card.phonetic}
                                    </span>
                                </div>

                                <div className="w-1/3 border-l border-gray-700 pl-4">
                                    <h3 className="text-xl font-bold text-blue-300 mb-1">{card.word_es}</h3>
                                </div>

                                <div className="w-1/3 border-l border-gray-700 pl-4 text-sm text-gray-400">
                                    <ul className="list-disc pl-4 space-y-1">
                                        {card.examples && card.examples.map((ex, i) => (
                                            <li key={i} className="italic">"{ex}"</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}

                    {cards.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No cards yet. Try generating one above!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
