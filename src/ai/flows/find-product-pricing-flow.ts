'use server';
/**
 * @fileOverview An AI agent that finds pricing information for a list of products
 * by using a web search tool.
 *
 * - findProductPricing - A function that takes a list of product names and quantity details,
 *                        and returns pricing information, website links, and vendor contacts.
 * - FindProductPricingInput - The input type for the findProductPricing function.
 * - FindProductPricingOutput - The return type for the findProductPricing function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { productSearchTool } from '@/ai/tools/product-search-tool'; // Import the tool

const ProductPricingInputSchema = z.object({
  productList: z.array(z.string()).describe('A list of product/service names.'),
  quantityDetails: z.string().describe('A string containing details about quantities for the products, potentially mixed.'),
});
export type FindProductPricingInput = z.infer<typeof ProductPricingInputSchema>;

const PricedItemSchema = z.object({
  name: z.string().describe('The product name from the input list.'),
  identifiedQuantity: z.string().describe('The specific quantity identified for this product from quantityDetails (e.g., "500 units", "200 sticks", or "Not numerically specified").'),
  rate: z.number().describe('Best per-item price (numeric). Set to 0 if not applicable or found.'),
  websiteLink: z.string().optional().describe('A plausible URL where this item can be purchased at this rate. Should be a direct product link if possible.'),
  vendorContactInfo: z.string().optional().describe('Plausible contact information for the vendor (e.g., email, phone, or main website contact page).'),
  subtotal: z.number().describe('Calculated subtotal (rate * numeric part of identifiedQuantity). Set to 0 if quantity is not numeric or rate is 0.'),
});

const ProductPricingOutputSchema = z.object({
  pricedItems: z.array(PricedItemSchema).describe('An array of items with their pricing information.'),
  totalAmount: z.number().describe('The sum of all subtotals.'),
});
export type FindProductPricingOutput = z.infer<typeof ProductPricingOutputSchema>;

export async function findProductPricing(input: FindProductPricingInput): Promise<FindProductPricingOutput> {
  return findProductPricingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findProductPricingPrompt',
  tools: [productSearchTool], // Make the tool available to the LLM
  input: {schema: ProductPricingInputSchema},
  output: {schema: ProductPricingOutputSchema},
  prompt: `You are an expert AI assistant specializing in procurement and supply chain analysis.
Your task is to process a list of product names and a detailed string describing their quantities to populate the 'pricedItems' array.

Product List:
{{#each productList}}
- {{{this}}}
{{/each}}

Quantity Details: "{{{quantityDetails}}}"

For each product in the 'productList':
1.  Determine its specific 'identifiedQuantity' by carefully parsing the 'quantityDetails' string. Also, extract the numerical part of this quantity.
    - Example: If 'productList' contains "SATA 2 HDD" and 'quantityDetails' says "500 SATA 2 HDD units...", then 'identifiedQuantity' is "500 units" and numerical quantity is 500.
    - If a product is not explicitly quantified, 'identifiedQuantity' should be "Not numerically specified" and numerical quantity is 0.

2.  Use the 'productSearchTool' with the product name and its numerical quantity (if > 0, otherwise pass 1 or omit).
    The tool will return a list of potential online purchasing options.

3.  From the tool's search results:
    a.  Select the **best option**. The "best" option should ideally have the lowest 'extractedPrice' (this will be your 'rate').
    b.  Ensure the 'link' from the tool's result is a direct product page if possible; this will be your 'websiteLink'.
    c.  Extract or infer 'vendorContactInfo' from the tool's result (e.g., 'sourceName' could be a starting point, or look for contact details in snippets). If a direct contact isn't obvious, the main website of the source is acceptable.
    d.  Critically consider if the source is likely to fulfill the 'identifiedQuantity'. Look for clues in the tool's 'title', 'snippet', or 'quantityContext'. Prioritize sources that seem equipped for the specified quantity.

4.  Calculate the 'subtotal' (rate * numerical quantity). If numerical quantity is 0 or rate is 0, subtotal is 0.

5.  If the 'productSearchTool' returns no suitable results or if an error occurs (e.g., 'SERP_API_KEY not configured' or 'No relevant product listings found'), set 'rate' to 0, 'subtotal' to 0, 'websiteLink' to "N/A", and 'vendorContactInfo' to "N/A" for that product.

Finally, calculate the 'totalAmount' by summing all 'subtotals'.

Return the complete information in the specified JSON format for ProductPricingOutputSchema.
Be thorough and ensure all fields in PricedItemSchema are populated accurately based on your analysis of the tool's output.
`,
});

const findProductPricingFlow = ai.defineFlow(
  {
    name: 'findProductPricingFlow',
    inputSchema: ProductPricingInputSchema,
    outputSchema: ProductPricingOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input); // The LLM will use the tool internally
    if (!output) {
        throw new Error("AI failed to generate pricing output. The prompt might have failed or returned an empty response.");
    }
    // Ensure subtotals and totalAmount are correctly calculated as a final check,
    // although the LLM should handle this based on the prompt.
    let calculatedTotalAmount = 0;
    const processedItems = output.pricedItems.map(item => {
        let numericQuantity = 0;
        const quantityMatch = item.identifiedQuantity.match(/(\d+)/);
        if (quantityMatch && quantityMatch[1]) {
            numericQuantity = parseInt(quantityMatch[1], 10);
        }

        let subtotal = 0;
        if (numericQuantity > 0 && item.rate > 0) {
            subtotal = numericQuantity * item.rate;
        } else {
          // If LLM didn't set rate to 0 for non-numeric qty, force it.
          item.rate = 0;
        }
        // Ensure subtotal is consistent
        if (item.subtotal !== subtotal) {
            console.warn(`Subtotal mismatch for ${item.name}. LLM: ${item.subtotal}, Calculated: ${subtotal}. Using calculated.`);
        }
        calculatedTotalAmount += subtotal;
        return { ...item, subtotal }; // Return the item with potentially corrected subtotal
    });
    
    // Ensure total amount is consistent
    if (output.totalAmount !== calculatedTotalAmount) {
        console.warn(`Total amount mismatch. LLM: ${output.totalAmount}, Calculated: ${calculatedTotalAmount}. Using calculated.`);
    }

    return {
        pricedItems: processedItems,
        totalAmount: calculatedTotalAmount,
    };
  }
);