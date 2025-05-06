'use server';
/**
 * @fileOverview An AI agent that finds pricing information for a list of products.
 *
 * - findProductPricing - A function that takes a list of product names and quantity details,
 *                        and returns pricing information, website links, and vendor contacts.
 * - FindProductPricingInput - The input type for the findProductPricing function.
 * - FindProductPricingOutput - The return type for the findProductPricing function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ProductPricingInputSchema = z.object({
  productList: z.array(z.string()).describe('A list of product/service names.'),
  quantityDetails: z.string().describe('A string containing details about quantities for the products, potentially mixed.'),
});
export type FindProductPricingInput = z.infer<typeof ProductPricingInputSchema>;

const PricedItemSchema = z.object({
  name: z.string().describe('The product name from the input list.'),
  identifiedQuantity: z.string().describe('The specific quantity identified for this product from quantityDetails (e.g., "500 units", "200 sticks", or "Not numerically specified").'),
  rate: z.number().describe('Best per-item price (numeric). Set to 0 if not applicable or found.'),
  websiteLink: z.string().url().optional().describe('A plausible URL where this item can be purchased at this rate.'),
  vendorContactInfo: z.string().optional().describe('Plausible contact information for the vendor (e.g., email or phone).'),
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
  input: {schema: ProductPricingInputSchema},
  output: {schema: ProductPricingOutputSchema},
  prompt: `You are an expert AI assistant specializing in procurement and supply chain analysis.
Your task is to process a list of product names and a detailed string describing their quantities.
First, for each product name in the 'productList', you must determine its specific quantity by carefully parsing the 'quantityDetails' string.

Product List:
{{#each productList}}
- {{{this}}}
{{/each}}

Quantity Details: "{{{quantityDetails}}}"

For each product, find the most competitive per-item rate available online from a reputable vendor.
Provide a plausible website link for purchase and vendor contact information (email or phone if available, otherwise "N/A").
Calculate the subtotal for each item (rate * quantity). If the quantity is not numerically specified (e.g., "General IT Support") or if the rate is 0, the subtotal should be 0.
Finally, calculate the total amount by summing all subtotals.

Output the results in the specified JSON format.

Important Considerations for Quantity Matching:
- Match product names to quantities mentioned in 'quantityDetails'. For example, if 'productList' contains "SATA 2 HDD" and 'quantityDetails' says "500 SATA 2 HDD units, 200 sticks of 2TB DDR4 RAM", the identifiedQuantity for "SATA 2 HDD" is "500 units".
- If a product from 'productList' is not explicitly quantified in 'quantityDetails', its identifiedQuantity should be "Not numerically specified".
- Extract the numerical part of the quantity for subtotal calculation. E.g., from "500 units", use 500. If "Not numerically specified", use 0 for calculation.

Example for Subtotal Calculation:
- Product: "Intel i9-9700K Processors", Identified Quantity: "300 Processors", Rate: 250.00 -> Subtotal: 300 * 250.00 = 75000.00
- Product: "Network Management", Identified Quantity: "Not numerically specified", Rate: 0 (or any value) -> Subtotal: 0

Return the information in the specified JSON format:
{
  "pricedItems": [
    {
      "name": "Product A",
      "identifiedQuantity": "100 units",
      "rate": 10.50,
      "websiteLink": "http://example.com/productA",
      "vendorContactInfo": "sales@example.com",
      "subtotal": 1050.00
    },
    // ... more items
  ],
  "totalAmount": 12345.67
}
`,
});

const findProductPricingFlow = ai.defineFlow(
  {
    name: 'findProductPricingFlow',
    inputSchema: ProductPricingInputSchema,
    outputSchema: ProductPricingOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate pricing output.");
    }
    // Post-process to ensure subtotals and totalAmount are correct based on logic
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
        }
        calculatedTotalAmount += subtotal;
        return { ...item, subtotal };
    });

    return {
        pricedItems: processedItems,
        totalAmount: calculatedTotalAmount,
    };
  }
);