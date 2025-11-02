import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Corrects spelling errors in the provided text without rephrasing
 * @param {string} text - The text to correct
 * @returns {Promise<string>} - The corrected text
 */
export const correctSpelling = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for spelling correction');
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create a prompt that specifically asks for spelling correction only
    const prompt = `Corrige uniquement les fautes d'orthographe dans le texte suivant. Ne modifie pas la structure, ne reformule pas, et ne change pas le sens. Retourne uniquement le texte corrigé, sans explication ni commentaire.

Texte à corriger :
"${text}"

Texte corrigé :`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const correctedText = response.text().trim();

    // Remove quotes if the AI added them
    const cleanedText = correctedText.replace(/^["']|["']$/g, '');

    return cleanedText;
  } catch (error) {
    console.error('Error correcting spelling with Gemini:', error);
    throw new Error(`Failed to correct spelling: ${error.message}`);
  }
};

/**
 * Suggests theme groups based on existing mini-themes
 * @param {Array} themes - Array of theme objects with id, name, description, and color
 * @returns {Promise<Array>} - Array of suggested theme groups
 */
export const suggestThemeGroups = async (themes) => {
  try {
    if (!themes || themes.length === 0) {
      throw new Error('At least one theme is required to suggest groups');
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare themes data for the AI
    const themesData = themes.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || 'Pas de description'
    }));

    const prompt = `Tu es un assistant IA qui aide à organiser des thèmes d'anime en groupes cohérents.

Voici une liste de mini-thèmes :
${JSON.stringify(themesData, null, 2)}

Analyse ces mini-thèmes et suggère 3 à 5 groupes de thèmes pertinents. Chaque groupe doit regrouper des mini-thèmes qui ont des concepts similaires ou complémentaires.

IMPORTANT : Retourne UNIQUEMENT un JSON valide au format suivant, sans explication ni texte supplémentaire :
[
  {
    "name": "Nom du groupe",
    "description": "Description courte du groupe",
    "themeIds": ["id1", "id2", "id3"],
    "color": "#XXXXXX"
  }
]

Règles :
- Choisir des noms de groupes génériques et pertinents
- Chaque groupe doit contenir au minimum 2 mini-thèmes
- Utiliser des couleurs hexadécimales variées et attrayantes
- Les descriptions doivent être courtes (1-2 phrases max)
- Ne pas créer trop de groupes (max 5)
- Regrouper par thématiques cohérentes

Retourne uniquement le JSON, rien d'autre.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonText = response.text().trim();

    // Clean up the response - remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const suggestions = JSON.parse(jsonText);

    // Validate the suggestions
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid response format from AI');
    }

    // Filter out invalid suggestions
    const validSuggestions = suggestions.filter(group => {
      return (
        group.name &&
        group.themeIds &&
        Array.isArray(group.themeIds) &&
        group.themeIds.length >= 2 &&
        group.color &&
        /^#[0-9A-F]{6}$/i.test(group.color)
      );
    });

    return validSuggestions;
  } catch (error) {
    console.error('Error suggesting theme groups with Gemini:', error);
    throw new Error(`Failed to suggest theme groups: ${error.message}`);
  }
};

/**
 * Suggests theme groups based on user input and existing mini-themes
 * @param {Array} themes - Array of theme objects with id, name, description, and color
 * @param {string} userInput - User's concept/idea for theme grouping
 * @returns {Promise<Array>} - Array of suggested theme groups
 */
export const suggestCustomThemeGroups = async (themes, userInput) => {
  try {
    if (!themes || themes.length === 0) {
      throw new Error('At least one theme is required to suggest groups');
    }

    if (!userInput || userInput.trim().length === 0) {
      throw new Error('User input is required for custom suggestions');
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare themes data for the AI
    const themesData = themes.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || 'Pas de description'
    }));

    const prompt = `Tu es un assistant IA qui aide à organiser des thèmes d'anime en groupes cohérents basés sur une idée de l'utilisateur.

CONCEPT/IDÉE DE L'UTILISATEUR :
"${userInput}"

Voici la liste de mini-thèmes disponibles :
${JSON.stringify(themesData, null, 2)}

En te basant sur le concept/l'idée de l'utilisateur ci-dessus, analyse ces mini-thèmes et suggère 2 à 4 groupes de thèmes qui correspondent à cette vision. Chaque groupe doit regrouper des mini-thèmes qui sont liés au concept demandé par l'utilisateur.

IMPORTANT : Retourne UNIQUEMENT un JSON valide au format suivant, sans explication ni texte supplémentaire :
[
  {
    "name": "Nom du groupe (lié au concept de l'utilisateur)",
    "description": "Description courte du groupe et comment il correspond à l'idée de l'utilisateur",
    "themeIds": ["id1", "id2", "id3"],
    "color": "#XXXXXX"
  }
]

Règles :
- Privilégier les thèmes qui correspondent au concept/idée de l'utilisateur
- Chaque groupe doit contenir au minimum 2 mini-thèmes
- Les noms de groupes doivent refléter le concept de l'utilisateur
- Utiliser des couleurs hexadécimales variées et attrayantes
- Les descriptions doivent expliquer le lien avec l'idée de l'utilisateur (1-2 phrases max)
- Ne pas créer trop de groupes (max 4)
- Si certains thèmes ne correspondent pas du tout au concept, ne pas les inclure

Retourne uniquement le JSON, rien d'autre.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonText = response.text().trim();

    // Clean up the response - remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const suggestions = JSON.parse(jsonText);

    // Validate the suggestions
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid response format from AI');
    }

    // Filter out invalid suggestions
    const validSuggestions = suggestions.filter(group => {
      return (
        group.name &&
        group.themeIds &&
        Array.isArray(group.themeIds) &&
        group.themeIds.length >= 2 &&
        group.color &&
        /^#[0-9A-F]{6}$/i.test(group.color)
      );
    });

    return validSuggestions;
  } catch (error) {
    console.error('Error suggesting custom theme groups with Gemini:', error);
    throw new Error(`Failed to suggest custom theme groups: ${error.message}`);
  }
};

/**
 * Suggests a theme name and description based on extract text
 * @param {string} extractText - The extract text to analyze
 * @returns {Promise<Object>} - Suggested theme with name and description
 */
export const suggestThemeFromText = async (extractText) => {
  try {
    if (!extractText || extractText.trim().length === 0) {
      throw new Error('Extract text is required to suggest a theme');
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Tu es un assistant IA qui aide à identifier le thème principal d'un extrait d'anime.

Analyse cet extrait et identifie le thème principal (concept, émotion, ou valeur) qu'il représente :

"${extractText}"

IMPORTANT : Retourne UNIQUEMENT un JSON valide au format suivant, sans explication ni texte supplémentaire :
{
  "name": "Nom du thème (court, 2-3 mots max)",
  "description": "Description du thème (1-2 phrases max)"
}

Règles :
- Le nom doit être un concept général (ex: "Courage", "Amitié", "Persévérance", "Sacrifice", etc.)
- La description doit expliquer brièvement pourquoi ce thème correspond à l'extrait
- Rester concis et pertinent
- Ne pas mentionner les personnages ou l'anime spécifiquement

Retourne uniquement le JSON, rien d'autre.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonText = response.text().trim();

    // Clean up the response - remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const suggestion = JSON.parse(jsonText);

    // Validate the suggestion
    if (!suggestion.name || !suggestion.description) {
      throw new Error('Invalid response format from AI');
    }

    return suggestion;
  } catch (error) {
    console.error('Error suggesting theme from text with Gemini:', error);
    throw new Error(`Failed to suggest theme: ${error.message}`);
  }
};

/**
 * Translates text to French
 * @param {string} text - The text to translate
 * @returns {Promise<string>} - The translated text in French
 */
export const translateText = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for translation');
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create a prompt for translation to French
    const prompt = `Traduis le texte suivant en français. Garde le ton et le style de l'original. Si c'est déjà en français, retourne le texte tel quel. Retourne uniquement la traduction, sans explication ni commentaire.

Texte à traduire :
"${text}"

Traduction en français :`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const translatedText = response.text().trim();

    // Remove quotes if the AI added them
    const cleanedText = translatedText.replace(/^["']|["']$/g, '');

    return cleanedText;
  } catch (error) {
    console.error('Error translating text with Gemini:', error);
    throw new Error(`Failed to translate text: ${error.message}`);
  }
};
