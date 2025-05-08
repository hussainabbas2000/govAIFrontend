'use server';
/**
 * @fileOverview A Genkit tool to search for product pricing and vendor information using SerpAPI.
 *
 * - productSearchTool - The Genkit tool definition.
 * - ProductSearchInputSchema - Input schema for the tool.
 * - ProductSearchOutputItemSchema - Schema for individual search results.
 * - ProductSearchOutputSchema - Output schema for the tool (array of results).
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'zod';

// Input schema for the tool
export const ProductSearchInputSchema = z.object({
  productName: z.string().describe('The name of the product to search for.'),
  requiredQuantity: z.number().optional().describe('The required quantity of the product. This helps in finding suppliers who can meet the demand.'),
});
export type ProductSearchInput = z.infer<typeof ProductSearchInputSchema>;

// Schema for a single search result item
export const ProductSearchOutputItemSchema = z.object({
  sourceName: z.string().optional().describe('Name of the website or vendor.'),
  title: z.string().optional().describe('Product title or listing title.'),
  link: z.string().optional().describe('Direct link to the product page.'),
  extractedPrice: z.number().optional().describe('Price extracted from the listing.'),
  priceCurrency: z.string().optional().default('USD').describe('Currency of the price.'),
  snippet: z.string().optional().describe('A brief description or snippet from the search result.'),
  quantityContext: z.string().optional().describe('Information related to quantity, stock, or bulk availability if found.'),
});
export type ProductSearchOutputItem = z.infer<typeof ProductSearchOutputItemSchema>;

// Output schema for the tool (an array of search results)
export const ProductSearchOutputSchema = z.array(ProductSearchOutputItemSchema).describe('A list of potential product purchasing options found online.');
export type ProductSearchOutput = z.infer<typeof ProductSearchOutputSchema>;


async function searchProductOnline(input: ProductSearchInput): Promise<ProductSearchOutput> {
  const { productName, requiredQuantity } = input;
  const serpApiKey = process.env.SERP_API_KEY;

  if (!serpApiKey) {
    console.warn('SERP_API_KEY is not set. Product search will not be performed.');
    // Return an empty array or a specific message if the API key is missing
    return [{ title: productName, snippet: 'SERP_API_KEY not configured. Real-time search unavailable.' }];
  }

  let searchQuery = `buy ${productName}`;
  if (requiredQuantity && requiredQuantity > 1) {
    searchQuery += ` quantity ${requiredQuantity} wholesale`;
  } else {
    searchQuery += ` best price`;
  }

  const params = new URLSearchParams({
    q: searchQuery,
    api_key: serpApiKey,
    engine: 'google', // Or 'google_shopping' for more e-commerce focused results
    num: '5', // Number of results to return
  });

  const url = `https://serpapi.com/search.json?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`SerpAPI request failed: ${response.status}`, errorData);
      throw new Error(`SerpAPI request failed: ${response.status}. ${errorData}`);
    }
    const searchData = await response.json();

    const results: ProductSearchOutput = [];

    // Process shopping results if available
    if (searchData.shopping_results && searchData.shopping_results.length > 0) {
      searchData.shopping_results.forEach((item: any) => {
        results.push({
          sourceName: item.source,
          title: item.title,
          link: item.link,
          extractedPrice: item.extracted_price || item.price,
          priceCurrency: item.currency || 'USD',
          snippet: item.snippet,
          quantityContext: `Required: ${requiredQuantity || 1}. Check link for bulk availability.`,
        });
      });
    }

    // Process organic results as a fallback or supplement
    if (searchData.organic_results && searchData.organic_results.length > 0) {
      searchData.organic_results.slice(0, 5 - results.length).forEach((item: any) => { // Limit total results
        // Try to find price in snippet or title if not a shopping result
        let priceMatch = item.snippet?.match(/\$?([0-9,]+\.?[0-9]*)/) || item.title?.match(/\$?([0-9,]+\.?[0-9]*)/);
        let extractedPrice;
        if (priceMatch && priceMatch[1]) {
          extractedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
        }

        results.push({
          sourceName: item.source || new URL(item.link).hostname,
          title: item.title,
          link: item.link,
          extractedPrice: extractedPrice,
          snippet: item.snippet,
          quantityContext: `Required: ${requiredQuantity || 1}. Verify quantity and contact vendor via link.`,
        });
      });
    }
    
    if (results.length === 0) {
        return [{ title: productName, snippet: 'No relevant product listings found via web search.' }];
    }

    return results;
  } catch (error) {
    console.error('Error performing product search via SerpAPI:', error);
    // Return an error indication or empty array
    return [{ title: productName, snippet: `Error during web search: ${error instanceof Error ? error.message : 'Unknown error'}` }];
  }
}

// Define the Genkit tool
export const productSearchTool = ai.defineTool(
  {
    name: 'productSearchTool',
    description: 'Searches online for product pricing, vendor information, and purchase links. Tries to consider required quantity.',
    inputSchema: ProductSearchInputSchema,
    outputSchema: ProductSearchOutputSchema,
  },
  searchProductOnline // The implementation function
);