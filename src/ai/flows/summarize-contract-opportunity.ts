/**
 * Sends a list of resource URLs to the Flask API for analysis,
 * then returns the parsed JSON response.
 * @param urls Array of URLs to analyze
 * @returns JSON response from Flask API or null if error
 */
async function fetchAnalyzedContractSummary(urls: string[]) {
  try {
    const response = await fetch('https://flasksummaryapi.onrender.com/analyze-solicitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from Flask API:', errorData);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

export { fetchAnalyzedContractSummary };
