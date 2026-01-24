import { PatternDefinition } from '../models/types';

// API Configuration - Set your API endpoint here
// Supports both OpenAI and Azure OpenAI (Azure AI Foundry)
const API_BASE_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.openai.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

// Azure OpenAI specific configuration
const IS_AZURE = process.env.EXPO_PUBLIC_AI_PROVIDER === 'azure';
const AZURE_API_VERSION = process.env.EXPO_PUBLIC_AZURE_API_VERSION || '2024-08-01-preview';
const AZURE_DEPLOYMENT_NAME = process.env.EXPO_PUBLIC_AZURE_DEPLOYMENT_NAME || 'gpt-5';

// Debug: Log environment variables at module load
console.log('[AIPatternService] Environment variables loaded:', {
  EXPO_PUBLIC_AI_PROVIDER: process.env.EXPO_PUBLIC_AI_PROVIDER,
  EXPO_PUBLIC_AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL,
  EXPO_PUBLIC_AZURE_DEPLOYMENT_NAME: process.env.EXPO_PUBLIC_AZURE_DEPLOYMENT_NAME,
  EXPO_PUBLIC_AZURE_API_VERSION: process.env.EXPO_PUBLIC_AZURE_API_VERSION,
  hasApiKey: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  IS_AZURE,
  API_BASE_URL,
});

interface PatternRecognitionRequest {
  smsText: string;
  senderId: string;
  timestamp?: string;
}

interface PatternRecognitionResponse {
  success: boolean;
  pattern: PatternDefinition | null;
  error?: string;
  confidence?: number;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI Pattern Recognition Service
 * 
 * This service uses OpenAI GPT or a compatible API to recognize and extract
 * patterns from bank SMS messages for automatic expense detection.
 * 
 * The API analyzes the SMS text and returns a pattern definition that can
 * be used to extract amount, date/time, and merchant information from
 * similar messages in the future.
 */
class AIPatternService {
  private apiUrl: string;
  private apiKey: string;
  private isAzure: boolean;
  private azureApiVersion: string;
  private azureDeploymentName: string;

  constructor(
    apiUrl: string = API_BASE_URL,
    apiKey: string = API_KEY,
    isAzure: boolean = IS_AZURE,
    azureApiVersion: string = AZURE_API_VERSION,
    azureDeploymentName: string = AZURE_DEPLOYMENT_NAME
  ) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.isAzure = isAzure;
    this.azureApiVersion = azureApiVersion;
    this.azureDeploymentName = azureDeploymentName;
  }

  /**
   * Set API configuration
   * @param apiUrl - Base URL for the API
   * @param apiKey - API key for authentication
   * @param isAzure - Whether using Azure OpenAI (Azure AI Foundry)
   * @param azureApiVersion - Azure API version (e.g., '2024-08-01-preview')
   * @param azureDeploymentName - Azure deployment name (e.g., 'gpt-5')
   */
  configure(
    apiUrl: string,
    apiKey: string,
    isAzure: boolean = false,
    azureApiVersion: string = '2024-08-01-preview',
    azureDeploymentName: string = 'gpt-5'
  ) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.isAzure = isAzure;
    this.azureApiVersion = azureApiVersion;
    this.azureDeploymentName = azureDeploymentName;
  }

  /**
   * Build the API endpoint URL based on provider
   */
  private getApiEndpoint(): string {
    if (this.isAzure) {
      // Check if this is Azure AI Foundry (services.ai.azure.com) or standard Azure OpenAI (openai.azure.com)
      if (this.apiUrl.includes('services.ai.azure.com')) {
        // Azure AI Foundry endpoint format:
        // https://{resource-name}.services.ai.azure.com/models/chat/completions?api-version={api-version}
        // OR for specific deployment:
        // https://{resource-name}.services.ai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
        return `${this.apiUrl}/openai/deployments/${this.azureDeploymentName}/chat/completions?api-version=${this.azureApiVersion}`;
      }
      // Standard Azure OpenAI endpoint format:
      // https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
      return `${this.apiUrl}/openai/deployments/${this.azureDeploymentName}/chat/completions?api-version=${this.azureApiVersion}`;
    }
    // Standard OpenAI endpoint
    return `${this.apiUrl}/chat/completions`;
  }

  /**
   * Build headers based on provider
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.isAzure) {
      // Azure uses 'api-key' header
      headers['api-key'] = this.apiKey;
    } else {
      // OpenAI uses 'Authorization: Bearer' header
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Analyze an SMS message using AI and return a pattern definition
   */
  async recognizePattern(request: PatternRecognitionRequest): Promise<PatternRecognitionResponse> {
    // Debug: Log configuration
    console.log('[AIPatternService] Configuration:', {
      isAzure: this.isAzure,
      apiUrl: this.apiUrl,
      deployment: this.azureDeploymentName,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
    });
    
    // If no API key configured, use fallback patterns
    if (!this.apiKey) {
      console.log('[AIPatternService] No API key configured, using fallback pattern matching');
      const fallbackResult = this.generateFallbackPattern(request);
      fallbackResult.error = 'No API key configured - using offline pattern matching';
      return fallbackResult;
    }

    const endpoint = this.getApiEndpoint();
    console.log('[AIPatternService] API Endpoint:', endpoint);

    try {
      const systemPrompt = `You are an expert at parsing bank SMS messages to extract transaction details.
Given an SMS message, analyze it and return a JSON object with regex patterns to extract:
1. Transaction amount (required)
2. Date/time of transaction (optional)
3. Merchant/vendor name (optional)

Return ONLY a valid JSON object in this exact format:
{
  "sender_regex": "regex to match sender ID",
  "amount_regex": "regex with capture group for amount",
  "amount_group": 1,
  "datetime_regex": "regex with capture group for date/time or null",
  "datetime_group": 1 or null,
  "datetime_format": "format string like 'dd-MM-yy' or null",
  "merchant_regex": "regex with capture group for merchant or null",
  "merchant_group": 1 or null,
  "confidence": 0.0 to 1.0
}`;

      const userPrompt = `Parse this bank SMS and create extraction patterns:

Sender ID: ${request.senderId}
SMS Text: ${request.smsText}
${request.timestamp ? `Timestamp: ${request.timestamp}` : ''}

Return the JSON pattern object.`;

      const messages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Build request body - Azure doesn't need 'model' field as it's in the URL
      const requestBody: Record<string, any> = {
        messages,
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      };

      // Only include model for non-Azure (OpenAI direct)
      if (!this.isAzure) {
        requestBody.model = 'gpt-4o-mini';
      }

      console.log('[AIPatternService] Making API request to:', endpoint);
      console.log('[AIPatternService] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('[AIPatternService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIPatternService] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from AI');
      }

      const parsed = JSON.parse(content);
      
      return {
        success: true,
        pattern: {
          senderRegex: parsed.sender_regex || `^${escapeRegex(request.senderId)}$`,
          amountRegex: parsed.amount_regex || '',
          dateTimeRegex: parsed.datetime_regex || null,
          merchantRegex: parsed.merchant_regex || null,
          amountGroup: parsed.amount_group || 1,
          dateTimeGroup: parsed.datetime_group || null,
          merchantGroup: parsed.merchant_group || null,
          dateTimeFormat: parsed.datetime_format || null,
        },
        confidence: parsed.confidence || 0.9,
      };
    } catch (error) {
      console.error('[AIPatternService] Pattern recognition failed:', error);
      
      // Return a fallback pattern using common Indian bank SMS formats
      const fallbackResult = this.generateFallbackPattern(request);
      // Add error info to help debugging
      if (fallbackResult.success) {
        fallbackResult.error = `Used fallback due to: ${error instanceof Error ? error.message : String(error)}`;
      }
      return fallbackResult;
    }
  }

  /**
   * Generate a fallback pattern when AI API is unavailable
   * Uses common Indian bank SMS patterns
   */
  private generateFallbackPattern(request: PatternRecognitionRequest): PatternRecognitionResponse {
    const smsText = request.smsText;
    const senderId = request.senderId;

    // Common patterns for Indian bank debit SMS
    const commonPatterns = [
      // Pattern 1: "Rs.1,234.56 debited" or "Rs 1234.56 debited"
      {
        amountRegex: /Rs\.?\s*([\d,]+(?:\.\d{2})?)\s*(?:has been\s*)?debited/i,
        type: 'debited',
      },
      // Pattern 2: "INR 1234.56 debited"
      {
        amountRegex: /INR\s*([\d,]+(?:\.\d{2})?)\s*(?:has been\s*)?debited/i,
        type: 'debited',
      },
      // Pattern 3: "debited by Rs.1234" or "debited with Rs 1234"
      {
        amountRegex: /debited\s*(?:by|with)?\s*Rs\.?\s*([\d,]+(?:\.\d{2})?)/i,
        type: 'debited',
      },
      // Pattern 4: "spent Rs.1234" or "purchased Rs 1234"
      {
        amountRegex: /(?:spent|purchased|paid)\s*Rs\.?\s*([\d,]+(?:\.\d{2})?)/i,
        type: 'spent',
      },
      // Pattern 5: "transaction of Rs.1234"
      {
        amountRegex: /transaction\s*(?:of)?\s*Rs\.?\s*([\d,]+(?:\.\d{2})?)/i,
        type: 'transaction',
      },
    ];

    // Try to match the SMS against common patterns
    for (const pattern of commonPatterns) {
      const match = smsText.match(pattern.amountRegex);
      if (match) {
        return {
          success: true,
          pattern: {
            senderRegex: `^${escapeRegex(senderId)}$`,
            amountRegex: pattern.amountRegex.source,
            dateTimeRegex: null,
            merchantRegex: null,
            amountGroup: 1,
            dateTimeGroup: null,
            merchantGroup: null,
            dateTimeFormat: null,
          },
          confidence: 0.7, // Lower confidence for fallback
        };
      }
    }

    // Generic fallback: try to find any currency amount
    const genericAmountPattern = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i;
    if (genericAmountPattern.test(smsText)) {
      return {
        success: true,
        pattern: {
          senderRegex: `^${escapeRegex(senderId)}$`,
          amountRegex: genericAmountPattern.source,
          dateTimeRegex: null,
          merchantRegex: null,
          amountGroup: 1,
          dateTimeGroup: null,
          merchantGroup: null,
          dateTimeFormat: null,
        },
        confidence: 0.5, // Even lower confidence for generic pattern
      };
    }

    return {
      success: false,
      pattern: null,
      error: 'Could not recognize SMS pattern',
    };
  }

  /**
   * Test a pattern against an SMS to verify it works correctly
   */
  async testPattern(pattern: PatternDefinition, smsText: string): Promise<{
    valid: boolean;
    amount?: number;
    dateTime?: string;
    merchant?: string;
  }> {
    try {
      const amountMatch = smsText.match(new RegExp(pattern.amountRegex, 'i'));
      
      if (!amountMatch || !amountMatch[pattern.amountGroup]) {
        return { valid: false };
      }

      const amountStr = amountMatch[pattern.amountGroup].replace(/,/g, '');
      const amount = parseFloat(amountStr);

      let dateTime: string | undefined;
      if (pattern.dateTimeRegex && pattern.dateTimeGroup) {
        const dateMatch = smsText.match(new RegExp(pattern.dateTimeRegex, 'i'));
        if (dateMatch && dateMatch[pattern.dateTimeGroup]) {
          dateTime = dateMatch[pattern.dateTimeGroup];
        }
      }

      let merchant: string | undefined;
      if (pattern.merchantRegex && pattern.merchantGroup) {
        const merchantMatch = smsText.match(new RegExp(pattern.merchantRegex, 'i'));
        if (merchantMatch && merchantMatch[pattern.merchantGroup]) {
          merchant = merchantMatch[pattern.merchantGroup];
        }
      }

      return {
        valid: true,
        amount,
        dateTime,
        merchant,
      };
    } catch (error) {
      console.error('Pattern test failed:', error);
      return { valid: false };
    }
  }
}

// Utility function to escape special regex characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Export singleton instance
export const aiPatternService = new AIPatternService();

// Export class for testing/customization
export { AIPatternService };
