# Flashcard Generation Directive

## Goal
Generate language learning flashcards with translations, phonetics, and examples using Gemini AI.

## Input
- **Word**: The target word in English.
- **Deck Context**: The deck ID (optional context).

## Tool
- `google-generative-ai` library (Gemini Pro model).

## Instructions
1.  **Prompt Engineering**: Use the exact prompt below.
    > "Actúa como un diccionario experto. Para la palabra en inglés '{word}', devuelve únicamente un objeto JSON con la siguiente estructura: { 'translation': '...', 'phonetic': '...', 'examples': ['ejemplo 1', 'ejemplo 2'] }"
2.  **Model Configuration**:
    - Temperature: 0.2 (Low for consistency)
    - Response MIME Type: `application/json`
3.  **Output Processing**:
    - Parse the JSON response.
    - Validate fields: `translation`, `phonetic`, `examples` (array).

## Edge Cases
- **Ambiguity**: If a word has multiple meanings, choose the most common one or the one fitting the deck format (if known).
- **Error Handling**: If the API fails or returns invalid JSON, return a standard error object to the client, do not crash.
