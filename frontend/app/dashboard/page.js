'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { PlusCircle, Book, Trash2, ArrowRight, Save, Sparkles, Brain } from 'lucide-react';

// Toast Component
const Toast = ({ message, onClose }) => (
    <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up z-50">
        <div className="bg-white/20 p-1 rounded-full">
            <Sparkles size={16} />
        </div>
        <span className="font-semibold">{message}</span>
        <button onClick={onClose} className="ml-2 hover:text-green-200">✕</button>
    </div>
);

export default function Dashboard() {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDeckName, setNewDeckName] = useState('');
    const [isCreatingDeck, setIsCreatingDeck] = useState(false);
    const router = useRouter();

    // New Card Generation State
    const [word, setWord] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewCard, setPreviewCard] = useState(null);
    const [selectedDeckId, setSelectedDeckId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchDecks();
    }, []);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const fetchDecks = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const response = await axios.get(`${API_URL}/decks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDecks(response.data);
            if (response.data.length > 0) {
                setSelectedDeckId(response.data[0].id);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching decks:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                router.push('/');
            }
            setLoading(false);
        }
    };

    const handleGeneratePreview = async (e) => {
        e.preventDefault();
        if (!word.trim()) return;

        setIsGenerating(true);
        setError('');
        setPreviewCard(null);

        try {
            const token = localStorage.getItem('token');
            // Call without deck_id to get preview
            const response = await axios.post(`${API_URL}/cards/generate`,
                { word },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPreviewCard(response.data);
        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate card. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveCard = async () => {
        if (!selectedDeckId || !previewCard) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/cards`,
                {
                    deck_id: selectedDeckId,
                    word_en: previewCard.word_en,
                    word_es: previewCard.word_es,
                    phonetic: previewCard.phonetic,
                    examples: previewCard.examples
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Reset
            setPreviewCard(null);
            setWord('');
            setShowSuccess(true);
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save card.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateDeck = async (e) => {
        e.preventDefault();
        if (!newDeckName.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/decks`,
                { name: newDeckName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNewDeckName('');
            setIsCreatingDeck(false);
            fetchDecks();
        } catch (error) {
            console.error('Error creating deck:', error);
        }
    };

    const handleDeleteDeck = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all cards in this deck.')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/decks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDecks();
        } catch (error) {
            console.error('Error deleting deck:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            {showSuccess && <Toast message="Card saved successfully!" onClose={() => setShowSuccess(false)} />}
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Dashboard
                    </h1>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            router.push('/');
                        }}
                        className="text-gray-400 hover:text-white"
                    >
                        Sign Out
                    </button>
                </header>

                {/* Quick Create Section */}
                <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-white">
                        <Sparkles className="text-yellow-400 mr-2" /> Quick Create Card
                    </h2>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Step 1: Input */}
                        <div className="flex-1">
                            <form onSubmit={handleGeneratePreview} className="flex gap-2">
                                <input
                                    type="text"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Type a word in English..."
                                    value={word}
                                    onChange={(e) => setWord(e.target.value)}
                                    disabled={isGenerating || !!previewCard}
                                />
                                <button
                                    type="submit"
                                    disabled={isGenerating || !word.trim() || !!previewCard}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    {isGenerating ? 'Analyzing...' : 'Analyze'}
                                </button>
                            </form>
                            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                        </div>

                        {/* Step 2: Preview & Save */}
                        {previewCard && (
                            <div className="flex-1 animate-fade-in bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-white">{previewCard.word_en}</h3>
                                    <p className="text-sm text-gray-400">{previewCard.phonetic}</p>
                                    <p className="text-blue-300 text-lg mt-1">{previewCard.word_es}</p>
                                    <ul className="mt-2 space-y-1">
                                        {previewCard.examples.map((ex, i) => (
                                            <li key={i} className="text-sm text-gray-400 italic">"{ex}"</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Select Deck</label>
                                        <select
                                            value={selectedDeckId}
                                            onChange={(e) => setSelectedDeckId(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        >
                                            {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleSaveCard}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center h-[38px]"
                                    >
                                        <Save size={16} className="mr-2" />
                                        {isSaving ? 'Saving...' : 'Save Card'}
                                    </button>
                                    <button
                                        onClick={() => { setPreviewCard(null); setWord(''); }}
                                        className="text-gray-400 hover:text-white px-3 py-2 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Your Decks</h2>
                    <button
                        onClick={() => setIsCreatingDeck(true)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-600"
                    >
                        <PlusCircle size={20} />
                        New Deck
                    </button>
                </div>

                {isCreatingDeck && (
                    <form onSubmit={handleCreateDeck} className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700 animate-fade-in">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Deck Name (e.g., Spanish Verbs)"
                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreatingDeck(false)}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading your decks...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {decks.map((deck) => (
                            <div
                                key={deck.id}
                                onClick={() => router.push(`/decks/${deck.id}`)}
                                className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-all hover:transform hover:-translate-y-1 group relative"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-900/30 rounded-full text-blue-400">
                                            <Book size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{deck.name}</h3>
                                            <p className="text-gray-400 text-sm mt-1">Created {new Date(deck.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/study/${deck.id}`);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                                        >
                                            <Brain size={16} /> Study
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteDeck(deck.id, e)}
                                            className="text-gray-500 hover:text-red-400 p-2 rounded-full hover:bg-gray-700 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {decks.length === 0 && !isCreatingDeck && (
                            <div className="col-span-full text-center py-12 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                                <p className="text-gray-400 mb-4">You have no decks yet.</p>
                                <button
                                    onClick={() => setIsCreatingDeck(true)}
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    Create your first deck
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
