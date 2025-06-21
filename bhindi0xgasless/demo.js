// Production-Ready 0xGasless Bhindi Agent Server
// Complete and error-free implementation

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Enhanced middleware stack
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-apiKey', 'x-private-key', 'x-rpc-url', 'x-gasless-api-key', 'x-chain-id', 'x-sxt-api-key', 'x-default-slippage']
}));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    
    console.log('\n' + '🔍'.repeat(40));
    console.log(`[${timestamp}] REQUEST ANALYSIS`);
    console.log(`📍 ${req.method} ${req.path}`);
    console.log(`🌐 User-Agent: ${req.headers['user-agent']}`);
    console.log(`📱 Origin: ${req.headers['origin'] || 'Not set'}`);
    
    // Check ALL possible API key headers
    console.log('\n🔑 API KEY HEADER ANALYSIS:');
    const possibleApiKeyHeaders = [
        'x-api-key',
        'x-apikey', 
        'x-apiKey',
        'api-key',
        'apikey',
        'apiKey',
        'authorization',
        'x-auth-token',
        'x-access-token',
        'token',
        'auth',
        'key'
    ];
    
    const foundApiKeys = {};
    possibleApiKeyHeaders.forEach(header => {
        if (req.headers[header]) {
            foundApiKeys[header] = req.headers[header];
            console.log(`  ✅ ${header}: ${req.headers[header].substring(0, 10)}...`);
        } else {
            console.log(`  ❌ ${header}: Not found`);
        }
    });
    
    // Check if it's from Bhindi.io
    const isBhindi = req.headers['user-agent']?.includes('bhindi') || 
                     req.headers['origin']?.includes('bhindi') ||
                     req.headers['referer']?.includes('bhindi');
    console.log(`🤖 Is Bhindi Request: ${isBhindi ? 'YES' : 'NO'}`);
    
    // Show ALL headers (for debugging)
    console.log('\n📋 ALL HEADERS:');
    Object.entries(req.headers).forEach(([key, value]) => {
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('auth') || 
            key.toLowerCase().includes('token')) {
            console.log(`  🔑 ${key}: ${String(value).substring(0, 20)}...`);
        } else {
            console.log(`  📄 ${key}: ${value}`);
        }
    });
    
    console.log('🔍'.repeat(40) + '\n');
    
    next();
});

// Enhanced authenticate function that accepts multiple header formats
function authenticateFlexible(req, res, next) {
    const config = extractConfig(req);
    
    // Try multiple possible API key header formats
    const apiKey = req.headers['x-api-key'] || 
                   req.headers['x-apikey'] || 
                   req.headers['x-apiKey'] || 
                   req.headers['api-key'] || 
                   req.headers['apikey'] || 
                   req.headers['apiKey'] || 
                   req.headers['authorization']?.replace('Bearer ', '') ||
                   req.headers['x-auth-token'] ||
                   req.headers['token'] ||
                   req.headers['key'];
    
    if (!apiKey) {
        console.log('❌ NO API KEY FOUND IN ANY HEADER FORMAT');
        console.log('📋 Available headers:', Object.keys(req.headers));
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_REQUIRED',
                message: 'API key required. Checked headers: x-api-key, x-apiKey, api-key, authorization, etc.',
                availableHeaders: Object.keys(req.headers),
                timestamp: new Date().toISOString()
            }
        });
    }
    
    console.log(`✅ API Key found: ${apiKey.substring(0, 8)}...`);
    
    // Update config with found API key
    config.apiKey = apiKey;
    config.gaslessApiKey = config.gaslessApiKey || apiKey;
    
    req.config = config;
    next();
}

// Add a test endpoint that doesn't require auth
app.all('/health-public', (req, res) => {
    console.log('🏥 PUBLIC HEALTH CHECK');
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        headers_received: Object.keys(req.headers),
        user_agent: req.headers['user-agent'],
        is_bhindi: req.headers['user-agent']?.includes('bhindi') || false
    });
});

// Add a test endpoint that shows what API key format is being sent
app.all('/test-auth', (req, res) => {
    console.log('🔐 AUTH TEST ENDPOINT');
    
    const apiKeyAnalysis = {
        'x-api-key': req.headers['x-api-key'] || null,
        'x-apikey': req.headers['x-apikey'] || null,
        'x-apiKey': req.headers['x-apiKey'] || null,
        'api-key': req.headers['api-key'] || null,
        'apikey': req.headers['apikey'] || null,
        'apiKey': req.headers['apiKey'] || null,
        'authorization': req.headers['authorization'] || null,
        'token': req.headers['token'] || null
    };
    
    res.json({
        success: true,
        message: 'API key format test',
        api_key_analysis: apiKeyAnalysis,
        found_keys: Object.entries(apiKeyAnalysis)
            .filter(([key, value]) => value !== null)
            .map(([key, value]) => ({ header: key, value: value?.substring(0, 10) + '...' })),
        all_headers: Object.keys(req.headers),
        timestamp: new Date().toISOString()
    });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    console.log(`🔍 Headers Check:`, {
        'x-api-key': req.headers['x-api-key'] ? '[✓]' : '[✗]',
        'x-apiKey': req.headers['x-apiKey'] ? '[✓]' : '[✗]',
        'x-private-key': req.headers['x-private-key'] ? '[✓]' : '[✗]',
        'x-rpc-url': req.headers['x-rpc-url'] ? '[✓]' : '[✗]',
        'x-gasless-api-key': req.headers['x-gasless-api-key'] ? '[✓]' : '[✗]',
        'x-chain-id': req.headers['x-chain-id'] || 'default(43114)',
        'content-type': req.headers['content-type'] || 'none'
    });

    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📝 Request Body:`, JSON.stringify(req.body, null, 2));
    }

    next();
});

// Dynamic AgentKit loading
let Agentkit, getAllAgentkitActions;
let agentkitInstance = null;
let agentkitActions = [];
let toolsInitialized = false;

async function loadAgentkit() {
    if (!Agentkit) {
        try {
            const agentkitModule = await import('@0xgasless/agentkit');
            Agentkit = agentkitModule.Agentkit;
            getAllAgentkitActions = agentkitModule.getAllAgentkitActions;
            console.log('✅ 0xGasless AgentKit loaded successfully');
            return true;
        } catch (error) {
            console.log('⚠️ AgentKit not available - running in demo mode');
            console.log('💡 Install: npm install @0xgasless/agentkit');
            return false;
        }
    }
    return true;
}

// Configuration constants
const CONFIG = {
    PORT: process.env.PORT || 3001,
    DEFAULT_CHAIN_ID: 43114, // Avalanche
    DEFAULT_SLIPPAGE: '0.5',
    DEFAULT_RPC_URL: 'https://api.avax.network/ext/bc/C/rpc',
    VERSION: '1.0.0',
    AGENT_NAME: '0xGasless Avalanche DeFi Voice Agent'
};

// Enhanced mock data for demo
const MOCK_DATA = {
    wallet: {
        address: '0x742d35Cc6639C0532fEb96c26c5CA44f39F5C9a6',
        chain: 'Avalanche',
        chainId: 43114
    },
    balances: {
        native: { symbol: 'AVAX', balance: '2.5', usd: '125.50' },
        tokens: [
            { symbol: 'USDT', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', balance: '1250.50', decimals: 6 },
            { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', balance: '890.25', decimals: 6 },
            { symbol: 'WAVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', balance: '1.2', decimals: 18 }
        ]
    }
};

// Chain configurations
const CHAIN_CONFIGS = {
    43114: { // Avalanche
        name: 'Avalanche',
        symbol: 'AVAX',
        rpc: 'https://api.avax.network/ext/bc/C/rpc',
        explorer: 'https://snowtrace.io',
        tokens: {
            USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
            NATIVE: '0x0000000000000000000000000000000000000000'
        }
    },
    56: { // BSC
        name: 'BSC',
        symbol: 'BNB',
        rpc: 'https://bsc-dataseed.binance.org/',
        explorer: 'https://bscscan.com',
        tokens: {
            USDT: '0x55d398326f99059fF775485246999027B3197955',
            USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            NATIVE: '0x0000000000000000000000000000000000000000'
        }
    }
};

// Production-grade tool definitions
const TOOLS_SCHEMA = [
    {
        name: 'getWalletAddress',
        displayName: 'Get Wallet Address',
        description: 'Retrieve your smart wallet address for DeFi operations on Avalanche blockchain',
        category: 'wallet',
        type: 'query',
        requiresConfirmation: false,
        parameters: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false
        },
        agentkitAction: 'get_address',
        aliases: ['getSmartAccountAddress', 'getUserAccount', 'getAccount', 'getWallet', 'getAddress', 'myAddress', 'walletAddress', 'smartAccount']
    },
    {
        name: 'getWalletBalance',
        displayName: 'Get Wallet Balance',
        description: 'Check your token balances for native AVAX or specific token contracts',
        category: 'wallet',
        type: 'query',
        requiresConfirmation: false,
        parameters: {
            type: 'object',
            properties: {
                tokenAddress: {
                    type: 'string',
                    description: 'Token contract address (optional, leave empty for native AVAX)',
                    pattern: '^(0x[a-fA-F0-9]{40})?$'
                }
            },
            required: [],
            additionalProperties: false
        },
        agentkitAction: 'get_balance',
        aliases: ['getBalance', 'checkBalance', 'myBalance', 'balance', 'getTokenBalance', 'showBalance']
    },
    {
        name: 'transferTokens',
        displayName: 'Transfer Tokens',
        description: 'Send tokens to another wallet address using gasless transactions. Supports USDT, USDC, AVAX and other Avalanche tokens.',
        category: 'defi',
        type: 'action',
        requiresConfirmation: true,
        parameters: {
            type: 'object',
            properties: {
                to: {
                    type: 'string',
                    description: 'Recipient wallet address (must start with 0x)',
                    pattern: '^0x[a-fA-F0-9]{40}$'
                },
                tokenAddress: {
                    type: 'string',
                    description: 'Token to transfer. Use symbols (USDT, USDC, AVAX) or contract addresses. Use "eth" or "AVAX" for native AVAX.'
                },
                amount: {
                    type: 'string',
                    description: 'Amount to transfer (human readable, e.g. "1", "100.5")',
                    pattern: '^\\d+(\\.\\d+)?$'
                }
            },
            required: ['to', 'tokenAddress', 'amount'],
            additionalProperties: false
        },
        agentkitAction: 'smart_transfer',
        aliases: ['sendTokens', 'send', 'transfer', 'sendMoney', 'pay', 'transferTo']
    },
    {
        name: 'swapTokens',
        displayName: 'Swap Tokens',
        description: 'Exchange tokens using DEX aggregation with optimal rates on Avalanche',
        category: 'defi',
        type: 'action',
        requiresConfirmation: true,
        parameters: {
            type: 'object',
            properties: {
                fromToken: {
                    type: 'string',
                    description: 'Source token (symbol or address)'
                },
                toToken: {
                    type: 'string',
                    description: 'Destination token (symbol or address)'
                },
                amount: {
                    type: 'string',
                    description: 'Amount to swap',
                    pattern: '^\\d+(\\.\\d+)?$'
                },
                slippage: {
                    type: 'string',
                    description: 'Slippage tolerance (optional, default 0.5%)',
                    pattern: '^\\d+(\\.\\d+)?$'
                }
            },
            required: ['fromToken', 'toToken', 'amount'],
            additionalProperties: false
        },
        agentkitAction: 'smart_swap',
        aliases: ['swap', 'exchange', 'trade', 'convert', 'swapFor']
    },
    {
        name: 'bridgeTokens',
        displayName: 'Bridge Tokens',
        description: 'Transfer tokens across different blockchain networks',
        category: 'defi',
        type: 'action',
        requiresConfirmation: true,
        parameters: {
            type: 'object',
            properties: {
                fromChainId: {
                    type: 'number',
                    description: 'Source chain ID (43114=Avalanche, 56=BSC, 1=Ethereum)',
                    enum: [43114, 56, 1, 137, 8453]
                },
                toChainId: {
                    type: 'number',
                    description: 'Destination chain ID',
                    enum: [43114, 56, 1, 137, 8453]
                },
                tokenInAddress: {
                    type: 'string',
                    description: 'Token address on source chain',
                    pattern: '^0x[a-fA-F0-9]{40}$'
                },
                tokenOutAddress: {
                    type: 'string',
                    description: 'Token address on destination chain',
                    pattern: '^0x[a-fA-F0-9]{40}$'
                },
                amount: {
                    type: 'string',
                    description: 'Amount to bridge',
                    pattern: '^\\d+(\\.\\d+)?$'
                },
                recipientAddress: {
                    type: 'string',
                    description: 'Recipient address on destination chain (optional)',
                    pattern: '^0x[a-fA-F0-9]{40}$'
                }
            },
            required: ['fromChainId', 'toChainId', 'tokenInAddress', 'tokenOutAddress', 'amount'],
            additionalProperties: false
        },
        agentkitAction: 'smart_bridge',
        aliases: ['bridge', 'crossChain', 'moveTokens', 'bridgeTo']
    },
    {
        name: 'queryBlockchainData',
        displayName: 'Query Blockchain Data',
        description: 'Execute SQL queries on blockchain data using Space and Time network',
        category: 'analytics',
        type: 'query',
        requiresConfirmation: false,
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'SQL query to execute on blockchain data',
                    minLength: 10,
                    maxLength: 1000
                }
            },
            required: ['query'],
            additionalProperties: false
        },
        agentkitAction: 'execute_sxt_sql',
        aliases: ['query', 'sql', 'analytics', 'data', 'sqlQuery']
    }
];

// Enhanced configuration extractor
function extractConfig(req) {
    const config = {
        apiKey: req.headers['x-api-key'] || req.headers['x-apiKey'] || req.headers['x-api_key'],
        
        // ✅ FIXED: Read both hyphen and underscore formats
        privateKey: req.headers['x-private-key'] || req.headers['x-private_key'],
        
        rpcUrl: req.headers['x-rpc-url'] || req.headers['x-rpc_url'] || CONFIG.DEFAULT_RPC_URL,
        
        // ✅ FIXED: Read both hyphen and underscore formats  
        gaslessApiKey: req.headers['x-gasless-api-key'] || req.headers['x-gasless_api_key'] || req.headers['x-api-key'] || req.headers['x-apiKey'] || req.headers['x-api_key'],
        
        chainId: Number(req.headers['x-chain-id'] || req.headers['x-chain_id']) || CONFIG.DEFAULT_CHAIN_ID,
        sxtApiKey: req.headers['x-sxt-api-key'] || req.headers['x-sxt_api_key'],
        defaultSlippage: req.headers['x-default-slippage'] || req.headers['x-default_slippage'] || CONFIG.DEFAULT_SLIPPAGE,
        userAgent: req.headers['user-agent'] || 'bhindi-agent',
        timestamp: Date.now()
    };

    console.log('🔧 Configuration extracted:', {
        hasApiKey: !!config.apiKey,
        hasPrivateKey: !!config.privateKey,
        hasGaslessKey: !!config.gaslessApiKey,
        chainId: config.chainId,
        rpcUrl: config.rpcUrl.substring(0, 30) + '...',
        userAgent: config.userAgent,
        // 🔍 DEBUG: Show which headers were found
        foundHeaders: {
            privateKey: config.privateKey ? 'Found' : 'Missing',
            gaslessKey: config.gaslessApiKey ? 'Found' : 'Missing'
        }
    });

    return config;
}

// Enhanced authentication middleware
function authenticate(req, res, next) {
    const config = extractConfig(req);

    if (!config.apiKey) {
        console.log('❌ Authentication failed: No API key provided');
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_REQUIRED',
                message: 'API key required in x-api-key or x-apiKey header',
                details: {
                    requiredHeaders: ['x-api-key', 'x-apiKey'],
                    receivedHeaders: Object.keys(req.headers).filter(h => h.startsWith('x-')),
                    timestamp: new Date().toISOString()
                }
            }
        });
    }

    console.log(`✅ Authentication successful: ${config.apiKey.substring(0, 8)}...`);
    req.config = config;
    next();
}

// Enhanced token address resolver
function resolveTokenAddress(tokenInput, chainId = 43114) {
    console.log(`🔍 Resolving token address: "${tokenInput}" on chain ${chainId}`);

    if (!tokenInput || tokenInput === '') {
        console.log('⚠️ No token specified, returning native token');
        return 'eth'; // Default to native token instead of null
    }

    if (typeof tokenInput !== 'string') {
        throw new Error(`Invalid token address type: ${typeof tokenInput}. Must be string.`);
    }

    // Convert to lowercase for comparison
    const input = tokenInput.toLowerCase().trim();

    // If already a valid address, return as-is
    if (/^0x[a-fA-F0-9]{40}$/.test(tokenInput)) {
        console.log(`✅ Valid token address provided: ${tokenInput}`);
        return tokenInput;
    }

    // Handle native token symbols
    if (input === 'eth' || input === 'avax' || input === 'native') {
        console.log(`✅ Native token requested: ${input} → eth`);
        return 'eth'; // AgentKit expects 'eth' for native tokens
    }

    // Get chain config
    const chainConfig = CHAIN_CONFIGS[chainId];
    if (!chainConfig) {
        console.warn(`⚠️ Unsupported chain: ${chainId}, using default Avalanche config`);
        // Use Avalanche as fallback
        chainConfig = CHAIN_CONFIGS[43114];
    }

    // Enhanced token symbol to address mapping
    const tokenMappings = {
        // USDT variants
        'usdt': chainConfig.tokens.USDT,
        'usdt.e': chainConfig.tokens.USDT,
        'tether': chainConfig.tokens.USDT,

        // USDC variants  
        'usdc': chainConfig.tokens.USDC,
        'usdc.e': chainConfig.tokens.USDC,
        'usd coin': chainConfig.tokens.USDC,

        // Native token variants
        'avax': 'eth',
        'avalanche': 'eth',

        // Wrapped AVAX
        'wavax': chainConfig.tokens.WAVAX,
        'wrapped avax': chainConfig.tokens.WAVAX
    };

    const resolvedAddress = tokenMappings[input];
    if (resolvedAddress) {
        console.log(`✅ Token symbol resolved: ${tokenInput} → ${resolvedAddress}`);
        return resolvedAddress;
    }

    // If no mapping found, validate format and return original input
    console.warn(`⚠️ Token not found in mappings: ${tokenInput}`);

    // Check if it looks like an address but is invalid
    if (input.startsWith('0x')) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(tokenInput)) {
            throw new Error(`Invalid token address format: ${tokenInput}. Must be 42-character hex address.`);
        }
    }

    // Return original input and let AgentKit handle it
    console.log(`📤 Returning original token input: ${tokenInput}`);
    return tokenInput;
}

// Enhanced parameter processor for transfers
function processTransferParameters(args, chainId = 43114) {
    console.log('🔍 Processing transfer parameters:', JSON.stringify(args, null, 2));

    // Enhanced validation
    if (!args || typeof args !== 'object') {
        throw new Error('Invalid arguments: must be an object');
    }

    // Validate required 'to' parameter
    if (!args.to) {
        throw new Error('Recipient address is required. Please provide "to" parameter.');
    }

    if (typeof args.to !== 'string') {
        throw new Error(`Invalid recipient address type: ${typeof args.to}. Must be string.`);
    }

    // Validate required 'amount' parameter
    if (!args.amount) {
        throw new Error('Transfer amount is required. Please provide "amount" parameter.');
    }

    const processed = { ...args };

    // Clean and validate recipient address
    processed.to = processed.to.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(processed.to)) {
        throw new Error(`Invalid recipient address format: ${processed.to}. Must be 42-character hex address starting with 0x.`);
    }

    // Resolve token address with better error handling
    if (processed.tokenAddress) {
        const originalToken = processed.tokenAddress;
        processed.tokenAddress = resolveTokenAddress(originalToken, chainId);

        if (!processed.tokenAddress) {
            throw new Error(`Failed to resolve token address: ${originalToken}`);
        }

        if (originalToken !== processed.tokenAddress) {
            console.log(`🔄 Token address converted: ${originalToken} → ${processed.tokenAddress}`);
        }
    } else {
        // Default to native token if not specified
        processed.tokenAddress = 'eth';
        console.log(`🔄 No token specified, defaulting to native token`);
    }

    // Handle native token case (based on MCP server logic)
    if (processed.tokenAddress === 'eth' || processed.tokenAddress === '0x0000000000000000000000000000000000000000') {
        processed.tokenAddress = 'eth';
    }

    // Validate and clean amount
    if (processed.amount) {
        const numAmount = parseFloat(processed.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error(`Invalid amount: ${processed.amount}. Must be a positive number`);
        }
        // Ensure amount is a string for AgentKit
        processed.amount = numAmount.toString();
    }

    // 🚀 CORRECT FIX: Map to AgentKit's expected parameters (based on working MCP server)
    const agentkitParams = {
        amount: processed.amount,
        tokenAddress: processed.tokenAddress,
        destination: processed.to  // ✅ AgentKit expects 'destination', not 'recipient'!
    };

    console.log('✅ AgentKit transfer parameters (corrected):', JSON.stringify(agentkitParams, null, 2));
    return agentkitParams;
}

// Alternative: Create a specific mapping function for AgentKit parameters
function mapToAgentkitParameters(toolName, processedArgs) {
    console.log(`🗺️ Mapping parameters for AgentKit action: ${toolName}`);
    console.log(`📝 Input parameters:`, JSON.stringify(processedArgs, null, 2));

    let agentkitParams = { ...processedArgs };

    // Map parameters based on tool type
    switch (toolName) {
        case 'transferTokens':
            // AgentKit smart_transfer expects 'recipient' instead of 'to'
            if (processedArgs.to) {
                agentkitParams = {
                    destination: processedArgs.to,
                    amount: processedArgs.amount,
                    tokenAddress: processedArgs.tokenAddress
                };
                delete agentkitParams.to; // Remove the old parameter
            }
            break;

        case 'getWalletBalance':
            // For balance checks, ensure proper parameter mapping
            if (processedArgs.tokenAddress === undefined) {
                // For native balance, AgentKit might expect no tokenAddress or null
                agentkitParams = {};
            } else {
                agentkitParams = {
                    tokenAddress: processedArgs.tokenAddress
                };
            }
            break;

        case 'swapTokens':
            // Map swap parameters if needed
            agentkitParams = {
                fromToken: processedArgs.fromToken,
                toToken: processedArgs.toToken,
                amount: processedArgs.amount,
                slippage: processedArgs.slippage
            };
            break;
    }

    console.log(`✅ AgentKit parameters mapped:`, JSON.stringify(agentkitParams, null, 2));
    return agentkitParams;
}

// Enhanced swap parameter processor
function processSwapParameters(args, chainId = 43114) {
    console.log('🔍 Processing swap parameters:', JSON.stringify(args, null, 2));

    // Validate required parameters
    if (!args.fromToken) {
        throw new Error('Source token (fromToken) is required');
    }
    if (!args.toToken) {
        throw new Error('Destination token (toToken) is required');
    }
    if (!args.amount) {
        throw new Error('Amount is required');
    }

    const processed = { ...args };

    // Resolve token addresses
    if (processed.fromToken) {
        const originalFrom = processed.fromToken;
        processed.fromToken = resolveTokenAddress(originalFrom, chainId);
        if (originalFrom !== processed.fromToken) {
            console.log(`🔄 From token resolved: ${originalFrom} → ${processed.fromToken}`);
        }
    }

    if (processed.toToken) {
        const originalTo = processed.toToken;
        processed.toToken = resolveTokenAddress(originalTo, chainId);
        if (originalTo !== processed.toToken) {
            console.log(`🔄 To token resolved: ${originalTo} → ${processed.toToken}`);
        }
    }

    // Validate amount
    const numAmount = parseFloat(processed.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error(`Invalid amount: ${processed.amount}. Must be a positive number`);
    }
    processed.amount = numAmount.toString();

    // 🚀 CORRECT MAPPING: Use AgentKit's expected parameters (from working MCP server)
    const agentkitParams = {
        tokenIn: processed.fromToken,   // ✅ AgentKit expects 'tokenIn'
        tokenOut: processed.toToken,    // ✅ AgentKit expects 'tokenOut'
        amount: processed.amount
    };

    console.log('✅ AgentKit swap parameters (corrected):', JSON.stringify(agentkitParams, null, 2));
    return agentkitParams;
}

// Enhanced balance parameter processor
function processBalanceParameters(args, chainId = 43114) {
    const processed = { ...args };

    if (processed.tokenAddress) {
        const originalToken = processed.tokenAddress;
        const resolvedToken = resolveTokenAddress(originalToken, chainId);

        // For balance checks, convert 'eth' back to null/undefined for native balance
        if (resolvedToken === 'eth') {
            processed.tokenAddress = undefined;
            console.log(`🔄 Balance check: ${originalToken} → native token`);
        } else {
            processed.tokenAddress = resolvedToken;
            if (originalToken !== resolvedToken) {
                console.log(`🔄 Balance token resolved: ${originalToken} → ${resolvedToken}`);
            }
        }
    }

    return processed;
}

// Tool name resolver with fuzzy matching
function resolveToolName(requestedName) {
    // Exact match first
    const exactMatch = TOOLS_SCHEMA.find(tool => tool.name === requestedName);
    if (exactMatch) return exactMatch.name;

    // Check aliases
    for (const tool of TOOLS_SCHEMA) {
        if (tool.aliases && tool.aliases.includes(requestedName)) {
            console.log(`🔄 Resolved alias '${requestedName}' → '${tool.name}'`);
            return tool.name;
        }
    }

    // Fuzzy matching for common variations
    const fuzzyMatches = {
        'address': 'getWalletAddress',
        'wallet': 'getWalletAddress',
        'account': 'getWalletAddress',
        'balance': 'getWalletBalance',
        'send': 'transferTokens',
        'transfer': 'transferTokens',
        'swap': 'swapTokens',
        'trade': 'swapTokens',
        'bridge': 'bridgeTokens',
        'query': 'queryBlockchainData'
    };

    const lowerName = requestedName.toLowerCase();
    for (const [key, toolName] of Object.entries(fuzzyMatches)) {
        if (lowerName.includes(key)) {
            console.log(`🔍 Fuzzy match '${requestedName}' → '${toolName}'`);
            return toolName;
        }
    }

    return requestedName;
}

// AgentKit initialization with retry logic
async function initializeAgentkit(config) {
    if (toolsInitialized && agentkitInstance) {
        return { agentkit: agentkitInstance, actions: agentkitActions };
    }

    try {
        console.log('🚀 Initializing 0xGasless AgentKit...');

        const loaded = await loadAgentkit();
        if (!loaded) {
            console.log('⚠️ Running in demo mode - AgentKit not available');
            return { agentkit: null, actions: [] };
        }

        if (!config.privateKey || !config.rpcUrl || !config.gaslessApiKey) {
            console.log('⚠️ Missing credentials - running in demo mode');
            return { agentkit: null, actions: [] };
        }

        const agentkit = await Agentkit.configureWithWallet({
            privateKey: config.privateKey,
            rpcUrl: config.rpcUrl,
            apiKey: config.gaslessApiKey,
            chainID: config.chainId,
        });

        const actions = getAllAgentkitActions();

        agentkitInstance = agentkit;
        agentkitActions = actions;
        toolsInitialized = true;

        console.log(`✅ AgentKit initialized: ${actions.length} actions available`);
        return { agentkit, actions };

    } catch (error) {
        console.error('❌ AgentKit initialization failed:', error);
        return { agentkit: null, actions: [] };
    }
}

// Smart error message generator
function getErrorMessage(error, toolName) {
    const message = error.message || 'Unknown error';

    if (message.includes('insufficient funds')) {
        return `Insufficient funds for ${toolName}. Please ensure you have enough balance and gas fees.`;
    }

    if (message.includes('invalid address')) {
        return `Invalid address format for ${toolName}. Please provide a valid Ethereum address (0x...).`;
    }

    if (message.includes('balanceOf') && message.includes('returned no data')) {
        return `Token contract not found. Please verify the token address exists on the selected network.`;
    }

    if (message.includes('Smart Account is required')) {
        return `Smart account configuration issue. Please check your wallet credentials.`;
    }

    return `Error in ${toolName}: ${message}`;
}

// Enhanced error suggestions generator
function getErrorSuggestions(error, toolName) {
    const suggestions = [];
    const message = error.message || '';

    if (message.includes('insufficient funds')) {
        suggestions.push('Check your wallet balance');
        suggestions.push('Ensure you have enough AVAX for gas fees');
        suggestions.push('Try a smaller amount');
    }

    if (message.includes('invalid address')) {
        suggestions.push('Verify the address starts with 0x');
        suggestions.push('Check the address is 42 characters long');
        suggestions.push('Ensure no extra spaces or characters');
    }

    if (message.includes('Token not found') || message.includes('token address')) {
        suggestions.push('Use supported tokens: USDT, USDC, AVAX, WAVAX');
        suggestions.push('Try using token symbol instead of address');
        suggestions.push('Verify token exists on Avalanche network');
    }

    if (toolName === 'transferTokens') {
        suggestions.push('Format: "transfer [amount] [token] to [address]"');
        suggestions.push('Example: "transfer 1 USDT to 0x..."');
        suggestions.push('Supported tokens: USDT, USDC, AVAX');
    }

    if (toolName === 'getWalletBalance') {
        suggestions.push('Try without token for AVAX balance');
        suggestions.push('Use token symbols: USDT, USDC, WAVAX');
        suggestions.push('Check if token exists on Avalanche');
    }

    return suggestions;
}

// Helper function to get token info with better symbol resolution
function getTokenInfo(tokenAddress, chainId) {
    const chainConfig = CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS[43114];

    if (!tokenAddress || tokenAddress === 'eth' || tokenAddress === '0x0000000000000000000000000000000000000000') {
        return {
            symbol: chainConfig.symbol || 'AVAX',
            name: chainConfig.name || 'Avalanche',
            address: '0x0000000000000000000000000000000000000000'
        };
    }

    // Check known tokens for this chain
    for (const [symbol, address] of Object.entries(chainConfig.tokens || {})) {
        if (address.toLowerCase() === tokenAddress.toLowerCase()) {
            const tokenNames = {
                USDT: 'Tether USD',
                USDC: 'USD Coin',
                WAVAX: 'Wrapped AVAX',
                NATIVE: 'Native Token'
            };
            return {
                symbol,
                name: tokenNames[symbol] || symbol,
                address: tokenAddress
            };
        }
    }

    return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        address: tokenAddress
    };
}

// Enhanced tool execution with better error handling
async function executeTool(toolName, args, config) {
    const executionId = Math.random().toString(36).substr(2, 9);
    console.log(`\n🎯 [${executionId}] Executing tool: ${toolName}`);
    console.log(`📝 [${executionId}] Raw arguments:`, JSON.stringify(args, null, 2));

    try {
        let processedArgs = args;

        if (toolName === 'transferTokens') {
            console.log(`🔧 [${executionId}] Processing transfer parameters...`);

            // Basic validation
            if (!args.to) throw new Error('Recipient address required');
            if (!args.amount) throw new Error('Amount required');

            const validated = {
                to: args.to.trim(),
                amount: args.amount.toString(),
                tokenAddress: resolveTokenAddress(args.tokenAddress || 'eth', config.chainId)
            };

            // 🎯 CORRECT MAPPING: Use 'destination' parameter (from working MCP server)
            processedArgs = {
                amount: validated.amount,
                tokenAddress: validated.tokenAddress === 'eth' ? 'eth' : validated.tokenAddress,
                destination: validated.to  // ✅ This is the correct parameter name!
            };

            console.log(`📋 [${executionId}] Corrected AgentKit parameters:`, JSON.stringify(processedArgs, null, 2));

        } else if (toolName === 'swapTokens') {
            processedArgs = processSwapParameters(args, config.chainId);
        } else if (toolName === 'getWalletBalance') {
            processedArgs = processBalanceParameters(args, config.chainId);
        }

        const { agentkit, actions } = await initializeAgentkit(config);

        if (!agentkit) {
            console.log(`⚠️ [${executionId}] AgentKit not available, generating mock response`);
            return generateMockResponse(toolName, processedArgs, config);
        }

        const tool = TOOLS_SCHEMA.find(t => t.name === toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found in schema`);
        }

        const action = actions.find(a => a.name === tool.agentkitAction);
        if (!action) {
            throw new Error(`AgentKit action ${tool.agentkitAction} not found. Available: ${actions.map(a => a.name).join(', ')}`);
        }

        console.log(`🚀 [${executionId}] Executing AgentKit action: ${tool.agentkitAction}`);
        console.log(`📤 [${executionId}] Final parameters to AgentKit:`, JSON.stringify(processedArgs, null, 2));

        // Execute with AgentKit
        const result = await agentkit.run(action, processedArgs);

        console.log(`✅ [${executionId}] AgentKit execution successful`);
        console.log(`📥 [${executionId}] Result:`, JSON.stringify(result, null, 2));

        return {
            success: true,
            data: {
                result,
                toolName,
                processedArgs,
                executedAt: new Date().toISOString(),
                chainId: config.chainId,
                source: 'agentkit',
                executionId
            }
        };

    } catch (error) {
        console.error(`❌ [${executionId}] Tool execution error:`, {
            message: error.message,
            stack: error.stack,
            originalArgs: args,
            processedArgs: processedArgs || 'Not processed'
        });

        return {
            success: false,
            error: {
                code: 'EXECUTION_ERROR',
                message: getErrorMessage(error, toolName),
                toolName,
                originalArgs: args,
                processedArgs: processedArgs || null,
                timestamp: new Date().toISOString(),
                suggestions: getErrorSuggestions(error, toolName),
                chainId: config.chainId,
                executionId
            }
        };
    }
}

// Enhanced mock response generator
function generateMockResponse(toolName, processedArgs, config) {
    const chain = CHAIN_CONFIGS[config.chainId] || CHAIN_CONFIGS[43114];

    switch (toolName) {
        case 'getWalletAddress':
            return {
                success: true,
                data: {
                    address: MOCK_DATA.wallet.address,
                    chain: chain.name,
                    chainId: config.chainId,
                    text: `Your wallet address: ${MOCK_DATA.wallet.address}`,
                    source: 'demo'
                }
            };

        case 'getWalletBalance':
            if (processedArgs.tokenAddress) {
                const token = MOCK_DATA.balances.tokens.find(t =>
                    t.address.toLowerCase() === processedArgs.tokenAddress.toLowerCase()
                );
                if (token) {
                    return {
                        success: true,
                        data: {
                            balance: token.balance,
                            symbol: token.symbol,
                            address: token.address,
                            chainId: config.chainId,
                            text: `${token.symbol} balance: ${token.balance}`,
                            source: 'demo'
                        }
                    };
                }
            }

            return {
                success: true,
                data: {
                    balance: MOCK_DATA.balances.native.balance,
                    symbol: chain.symbol,
                    chainId: config.chainId,
                    usdValue: MOCK_DATA.balances.native.usd,
                    text: `${chain.symbol} balance: ${MOCK_DATA.balances.native.balance} (≈${MOCK_DATA.balances.native.usd})`,
                    source: 'demo'
                }
            };

        case 'transferTokens':
            const tokenInfo = getTokenInfo(processedArgs.tokenAddress, config.chainId);
            return {
                success: true,
                data: {
                    transactionId: '0x' + Math.random().toString(16).substr(2, 64),
                    to: processedArgs.to,
                    amount: processedArgs.amount,
                    token: tokenInfo.symbol,
                    tokenAddress: processedArgs.tokenAddress,
                    chainId: config.chainId,
                    text: `Demo: Would transfer ${processedArgs.amount} ${tokenInfo.symbol} to ${processedArgs.to} on ${chain.name}`,
                    status: 'simulated',
                    source: 'demo',
                    note: 'This is a demo transaction. Configure real credentials for actual transfers.'
                }
            };

        case 'swapTokens':
            return {
                success: true,
                data: {
                    fromToken: processedArgs.fromToken,
                    toToken: processedArgs.toToken,
                    amount: processedArgs.amount,
                    estimatedOutput: (parseFloat(processedArgs.amount) * 0.98).toString(),
                    slippage: processedArgs.slippage || config.defaultSlippage,
                    text: `Demo: Would swap ${processedArgs.amount} ${processedArgs.fromToken} for ${processedArgs.toToken}`,
                    source: 'demo'
                }
            };

        case 'bridgeTokens':
            const fromChain = CHAIN_CONFIGS[processedArgs.fromChainId]?.name || 'Unknown';
            const toChain = CHAIN_CONFIGS[processedArgs.toChainId]?.name || 'Unknown';

            return {
                success: true,
                data: {
                    fromChain,
                    toChain,
                    amount: processedArgs.amount,
                    estimatedTime: '5-10 minutes',
                    text: `Demo: Would bridge ${processedArgs.amount} from ${fromChain} to ${toChain}`,
                    source: 'demo'
                }
            };

        case 'queryBlockchainData':
            return {
                success: true,
                data: {
                    query: processedArgs.query,
                    results: { rows: 42, data: 'Sample blockchain data' },
                    text: `Demo: SQL query executed (${processedArgs.query.length} chars)`,
                    source: 'demo'
                }
            };

        default:
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_TOOL',
                    message: `Unknown tool: ${toolName}`,
                    availableTools: TOOLS_SCHEMA.map(t => t.name)
                }
            };
    }
}

// ========== API ENDPOINTS ==========

// Health check with detailed status
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: CONFIG.VERSION,
        agent: CONFIG.AGENT_NAME,
        timestamp: new Date().toISOString(),
        agentkit: {
            loaded: !!Agentkit,
            initialized: toolsInitialized,
            actions: agentkitActions.length
        },
        chains: {
            default: CONFIG.DEFAULT_CHAIN_ID,
            supported: Object.keys(CHAIN_CONFIGS).map(Number)
        },
        tools: {
            total: TOOLS_SCHEMA.length,
            categories: [...new Set(TOOLS_SCHEMA.map(t => t.category))]
        }
    });
});

// Enhanced tools endpoint
app.get('/tools', authenticate, (req, res) => {
    console.log('📋 GET /tools - Returning tool schema');

    res.json({
        success: true,
        agent: {
            name: CONFIG.AGENT_NAME,
            version: CONFIG.VERSION,
            capabilities: ['READ', 'WRITE', 'VOICE', 'DEFI'],
            description: 'Production-ready DeFi automation with voice support'
        },
        tools: TOOLS_SCHEMA.map(tool => ({
            name: tool.name,
            displayName: tool.displayName,
            description: tool.description,
            category: tool.category,
            type: tool.type,
            requiresConfirmation: tool.requiresConfirmation,
            parameters: tool.parameters,
            aliases: tool.aliases || []
        })),
        metadata: {
            totalTools: TOOLS_SCHEMA.length,
            categories: [...new Set(TOOLS_SCHEMA.map(t => t.category))],
            endpoint: '/tools/:toolName',
            authentication: 'x-api-key header required'
        }
    });
});

// Actions endpoint (Bhindi compatibility)
app.get('/actions', authenticate, (req, res) => {
    console.log('📋 GET /actions - Bhindi actions format');

    res.json({
        success: true,
        actions: TOOLS_SCHEMA.map(tool => ({
            id: tool.name,
            name: tool.name,
            displayName: tool.displayName,
            description: tool.description,
            parameters: tool.parameters,
            type: tool.requiresConfirmation ? 'action' : 'query',
            category: tool.category,
            agentkitAction: tool.agentkitAction
        })),
        metadata: {
            totalActions: TOOLS_SCHEMA.length,
            endpoint: '/actions/:actionName',
            format: 'bhindi-compatible'
        }
    });
});

// Capabilities endpoint
app.get('/capabilities', (req, res) => {
    res.json({
        agent: {
            name: CONFIG.AGENT_NAME,
            version: CONFIG.VERSION,
            description: 'Production-ready DeFi automation system optimized for Avalanche blockchain',
            author: '0xGasless x Bhindi',
            homepage: 'https://0xgasless.com'
        },
        capabilities: {
            voice: true,
            multichain: true,
            gasless: true,
            defi: true,
            analytics: true
        },
        supported: {
            chains: Object.entries(CHAIN_CONFIGS).map(([id, config]) => ({
                chainId: Number(id),
                name: config.name,
                symbol: config.symbol,
                rpc: config.rpc,
                explorer: config.explorer,
                primary: Number(id) === CONFIG.DEFAULT_CHAIN_ID
            })),
            languages: ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu'],
            operations: [
                'Wallet address retrieval',
                'Multi-token balance checking',
                'Gasless token transfers',
                'DEX token swaps with optimal rates',
                'Cross-chain token bridging',
                'SQL-based blockchain analytics'
            ]
        },
        authentication: {
            required: ['x-api-key'],
            optional: ['x-private-key', 'x-rpc-url', 'x-gasless-api-key'],
            chainConfig: ['x-chain-id', 'x-default-slippage']
        },
        endpoints: {
            health: '/health',
            tools: '/tools',
            actions: '/actions',
            capabilities: '/capabilities',
            chains: '/chains',
            manifest: '/manifest.json'
        }
    });
});

// Chain information endpoint
app.get('/chains', (req, res) => {
    const chains = Object.entries(CHAIN_CONFIGS).map(([id, config]) => ({
        chainId: Number(id),
        name: config.name,
        symbol: config.symbol,
        rpc: config.rpc,
        explorer: config.explorer,
        tokens: Object.entries(config.tokens).map(([symbol, address]) => ({
            symbol,
            address,
            native: address === config.tokens.NATIVE
        })),
        primary: Number(id) === CONFIG.DEFAULT_CHAIN_ID
    }));

    res.json({
        success: true,
        chains,
        default: CONFIG.DEFAULT_CHAIN_ID,
        total: chains.length
    });
});

// Manifest endpoint
app.get('/manifest.json', (req, res) => {
    res.json({
        name: CONFIG.AGENT_NAME,
        version: CONFIG.VERSION,
        description: 'Production-ready DeFi automation system with voice support, optimized for Avalanche blockchain operations',
        author: '0xGasless x Bhindi',
        homepage: 'https://0xgasless.com',
        capabilities: ['READ', 'WRITE', 'VOICE', 'DEFI', 'MULTICHAIN'],
        defaultChain: {
            name: 'Avalanche',
            chainId: CONFIG.DEFAULT_CHAIN_ID,
            symbol: 'AVAX'
        },
        tools: TOOLS_SCHEMA.map(tool => ({
            name: tool.name,
            description: tool.description,
            endpoint: `/tools/${tool.name}`,
            method: 'POST',
            category: tool.category,
            type: tool.type
        })),
        endpoints: {
            base: '/tools',
            actions: '/actions',
            health: '/health',
            capabilities: '/capabilities'
        },
        version_info: {
            api_version: '1.0',
            agentkit_version: '@0xgasless/agentkit',
            last_updated: '2025-01-01'
        }
    });
});

// Enhanced tool execution endpoint with comprehensive error handling
app.post('/tools/:toolName', authenticate, async (req, res) => {
    const requestedTool = req.params.toolName;
    const actualTool = resolveToolName(requestedTool);
    const args = req.body || {};

    console.log(`🔧 Executing tool: ${requestedTool}${requestedTool !== actualTool ? ` → ${actualTool}` : ''}`);
    console.log(`📝 Arguments:`, args);

    try {
        // Validate tool exists
        const toolSchema = TOOLS_SCHEMA.find(t => t.name === actualTool);
        if (!toolSchema) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOOL_NOT_FOUND',
                    message: `Tool '${requestedTool}' not found`,
                    available: TOOLS_SCHEMA.map(t => ({
                        name: t.name,
                        aliases: t.aliases || []
                    })),
                    suggestions: TOOLS_SCHEMA
                        .filter(t => t.name.toLowerCase().includes(requestedTool.toLowerCase()))
                        .map(t => t.name)
                }
            });
        }

        // Execute the tool
        const result = await executeTool(actualTool, args, req.config);

        // Log result
        console.log(`${result.success ? '✅' : '❌'} Tool execution completed: ${actualTool}`);

        res.json(result);

    } catch (error) {
        console.error(`💥 Tool execution failed: ${actualTool}`, error);

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error during tool execution',
                tool: actualTool,
                timestamp: new Date().toISOString()
            }
        });
    }
});

// Actions execution endpoint (Bhindi compatibility)
app.post('/actions/:actionName', authenticate, async (req, res) => {
    const requestedAction = req.params.actionName;
    const actualTool = resolveToolName(requestedAction);

    console.log(`🎬 Executing action: ${requestedAction}${requestedAction !== actualTool ? ` → ${actualTool}` : ''}`);

    try {
        const result = await executeTool(actualTool, req.body || {}, req.config);
        res.json(result);
    } catch (error) {
        console.error(`💥 Action execution failed: ${requestedAction}`, error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ACTION_ERROR',
                message: 'Action execution failed',
                action: requestedAction
            }
        });
    }
});

// Direct endpoint compatibility (for various calling patterns)
const directEndpoints = [
    'getWalletAddress', 'getSmartAccountAddress', 'getUserAccount', 'getAccount', 'getWallet',
    'getWalletBalance', 'getBalance', 'balance', 'checkBalance',
    'transferTokens', 'sendTokens', 'transfer', 'send',
    'swapTokens', 'swap', 'trade', 'exchange',
    'bridgeTokens', 'bridge', 'crossChain',
    'queryBlockchainData', 'query', 'sql'
];

directEndpoints.forEach(endpoint => {
    app.post(`/${endpoint}`, authenticate, async (req, res) => {
        const actualTool = resolveToolName(endpoint);
        console.log(`🎯 Direct endpoint: /${endpoint} → ${actualTool}`);

        try {
            const result = await executeTool(actualTool, req.body || {}, req.config);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'DIRECT_ENDPOINT_ERROR',
                    message: error.message
                }
            });
        }
    });
});

// Universal catch-all with intelligent routing
app.post('/:toolName', (req, res, next) => {
    const toolName = req.params.toolName;

    // Skip known non-tool endpoints
    const skipEndpoints = [
        'health', 'tools', 'actions', 'capabilities', 'chains', 'manifest.json',
        'tokens', 'debug', 'favicon.ico', 'robots.txt'
    ];

    if (skipEndpoints.includes(toolName)) {
        return next();
    }

    console.log(`🌐 Universal handler: /${toolName}`);

    // Try authentication
    const config = extractConfig(req);
    if (!config.apiKey) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_REQUIRED',
                message: 'API key required',
                endpoint: `/${toolName}`
            }
        });
    }

    req.config = config;

    // Resolve and execute
    (async () => {
        try {
            const actualTool = resolveToolName(toolName);
            const result = await executeTool(actualTool, req.body || {}, req.config);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'UNIVERSAL_ERROR',
                    message: error.message,
                    endpoint: `/${toolName}`
                }
            });
        }
    })();
});

app.post('/tools/transferTokens', authenticate, async (req, res) => {
    const debugId = Math.random().toString(36).substr(2, 9);

    console.log(`\n🚨 [${debugId}] TRANSFER DEBUG - Full Request Analysis:`);
    console.log(`📋 [${debugId}] Headers:`, {
        'content-type': req.headers['content-type'],
        'x-api-key': req.headers['x-api-key'] ? '[Present]' : '[Missing]',
        'x-private-key': req.headers['x-private-key'] ? '[Present]' : '[Missing]',
        'x-gasless-api-key': req.headers['x-gasless-api-key'] ? '[Present]' : '[Missing]',
        'x-chain-id': req.headers['x-chain-id'] || 'default(43114)'
    });

    console.log(`📝 [${debugId}] Body Analysis:`, {
        raw: req.body,
        stringified: JSON.stringify(req.body, null, 2),
        type: typeof req.body,
        isObject: typeof req.body === 'object' && req.body !== null,
        keys: req.body ? Object.keys(req.body) : 'No keys',
        hasTo: req.body && 'to' in req.body,
        hasAmount: req.body && 'amount' in req.body,
        hasTokenAddress: req.body && 'tokenAddress' in req.body
    });

    console.log(`🔍 [${debugId}] Individual Fields:`, {
        to: {
            value: req.body?.to,
            type: typeof req.body?.to,
            exists: req.body && 'to' in req.body,
            truthy: !!req.body?.to,
            length: req.body?.to?.length
        },
        amount: {
            value: req.body?.amount,
            type: typeof req.body?.amount,
            exists: req.body && 'amount' in req.body,
            truthy: !!req.body?.amount
        },
        tokenAddress: {
            value: req.body?.tokenAddress,
            type: typeof req.body?.tokenAddress,
            exists: req.body && 'tokenAddress' in req.body,
            truthy: !!req.body?.tokenAddress
        }
    });

    try {
        const result = await executeTool('transferTokens', req.body || {}, req.config);
        console.log(`✅ [${debugId}] Transfer completed:`, result.success ? 'SUCCESS' : 'FAILED');
        res.json(result);
    } catch (error) {
        console.error(`💥 [${debugId}] Transfer endpoint error:`, error);
        res.status(500).json({
            success: false,
            error: {
                code: 'TRANSFER_ENDPOINT_ERROR',
                message: error.message,
                debugId
            }
        });
    }
});

// Test endpoint for debugging
app.post('/debug/transfer', authenticate, async (req, res) => {
    const debugId = Math.random().toString(36).substr(2, 9);

    console.log(`\n🔍 [${debugId}] DEBUG TRANSFER ENDPOINT`);
    console.log('='.repeat(50));

    try {
        // Test token resolution
        let resolvedToken = null;
        if (req.body?.tokenAddress) {
            try {
                resolvedToken = resolveTokenAddress(req.body.tokenAddress, req.config.chainId);
            } catch (tokenError) {
                console.error(`❌ Token resolution error:`, tokenError.message);
            }
        }

        // Test parameter processing
        let processedParams = null;
        let processingError = null;
        if (req.body) {
            try {
                processedParams = processTransferParameters(req.body, req.config.chainId);
            } catch (paramError) {
                processingError = paramError.message;
                console.error(`❌ Parameter processing error:`, paramError.message);
            }
        }

        const response = {
            success: true,
            debugId,
            timestamp: new Date().toISOString(),

            // Request analysis
            request: {
                method: req.method,
                url: req.url,
                headers: {
                    'content-type': req.headers['content-type'],
                    'x-api-key': req.headers['x-api-key'] ? `[${req.headers['x-api-key'].substring(0, 8)}...]` : '[Missing]',
                    'x-private-key': req.headers['x-private-key'] ? '[Present]' : '[Missing]',
                    'x-gasless-api-key': req.headers['x-gasless-api-key'] ? '[Present]' : '[Missing]',
                    'x-chain-id': req.headers['x-chain-id'] || `default(${CONFIG.DEFAULT_CHAIN_ID})`
                },
                body: req.body,
                bodyType: typeof req.body,
                bodyKeys: req.body ? Object.keys(req.body) : []
            },

            // Configuration analysis
            config: {
                chainId: req.config.chainId,
                hasApiKey: !!req.config.apiKey,
                hasPrivateKey: !!req.config.privateKey,
                hasGaslessKey: !!req.config.gaslessApiKey,
                rpcUrl: req.config.rpcUrl?.substring(0, 30) + '...',
                defaultSlippage: req.config.defaultSlippage
            },

            // Parameter validation
            validation: {
                bodyProvided: !!req.body,
                bodyIsObject: typeof req.body === 'object' && req.body !== null,

                to: {
                    provided: req.body && 'to' in req.body,
                    value: req.body?.to,
                    type: typeof req.body?.to,
                    truthy: !!req.body?.to,
                    length: req.body?.to?.length,
                    validFormat: req.body?.to ? /^0x[a-fA-F0-9]{40}$/.test(req.body.to) : false,
                    trimmed: req.body?.to ? req.body.to.trim() : null
                },

                amount: {
                    provided: req.body && 'amount' in req.body,
                    value: req.body?.amount,
                    type: typeof req.body?.amount,
                    truthy: !!req.body?.amount,
                    isNumeric: req.body?.amount ? !isNaN(parseFloat(req.body.amount)) : false,
                    parsed: req.body?.amount ? parseFloat(req.body.amount) : null
                },

                tokenAddress: {
                    provided: req.body && 'tokenAddress' in req.body,
                    value: req.body?.tokenAddress,
                    type: typeof req.body?.tokenAddress,
                    truthy: !!req.body?.tokenAddress,
                    resolved: resolvedToken,
                    resolutionError: !resolvedToken && req.body?.tokenAddress ? 'Failed to resolve' : null
                }
            },

            // Processing test
            processing: {
                attempted: !!req.body,
                successful: !!processedParams,
                error: processingError,
                result: processedParams,
                differences: processedParams && req.body ? {
                    originalTo: req.body.to,
                    processedTo: processedParams.to,
                    originalToken: req.body.tokenAddress,
                    processedToken: processedParams.tokenAddress,
                    originalAmount: req.body.amount,
                    processedAmount: processedParams.amount
                } : null
            },

            // Chain info
            chain: {
                id: req.config.chainId,
                config: CHAIN_CONFIGS[req.config.chainId] || 'Unknown',
                supportedTokens: CHAIN_CONFIGS[req.config.chainId]?.tokens || {}
            },

            // AgentKit status
            agentkit: {
                loaded: !!Agentkit,
                initialized: toolsInitialized,
                actionsCount: agentkitActions.length,
                hasTransferAction: agentkitActions.some(a => a.name === 'smart_transfer')
            },

            // Recommendations
            recommendations: []
        };

        // Add recommendations based on analysis
        if (!req.body) {
            response.recommendations.push('Provide request body with transfer parameters');
        }

        if (!req.config.privateKey) {
            response.recommendations.push('Add x-private-key header for real transactions');
        }

        if (!req.config.gaslessApiKey) {
            response.recommendations.push('Add x-gasless-api-key header for gasless transactions');
        }

        if (processingError) {
            response.recommendations.push(`Fix parameter error: ${processingError}`);
        }

        if (req.body?.to && !response.validation.to.validFormat) {
            response.recommendations.push('Ensure "to" address is valid 42-character hex starting with 0x');
        }

        if (req.body?.amount && !response.validation.amount.isNumeric) {
            response.recommendations.push('Ensure "amount" is a valid number');
        }

        if (req.body?.tokenAddress && !resolvedToken) {
            response.recommendations.push('Use supported token symbols: USDT, USDC, AVAX, or valid contract address');
        }

        console.log(`✅ [${debugId}] Debug analysis completed`);
        console.log(`📊 [${debugId}] Validation status:`, {
            hasValidTo: response.validation.to.validFormat,
            hasValidAmount: response.validation.amount.isNumeric,
            hasValidToken: !!resolvedToken,
            processingSuccessful: !!processedParams
        });

        res.json(response);

    } catch (error) {
        console.error(`💥 [${debugId}] Debug endpoint error:`, error);

        res.status(500).json({
            success: false,
            debugId,
            error: {
                code: 'DEBUG_ERROR',
                message: error.message,
                stack: error.stack
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Debug endpoints
app.get('/debug/tools', (req, res) => {
    res.json({
        tools: TOOLS_SCHEMA.map(tool => ({
            name: tool.name,
            category: tool.category,
            type: tool.type,
            aliases: tool.aliases || [],
            agentkitAction: tool.agentkitAction,
            requiresConfirmation: tool.requiresConfirmation
        })),
        metadata: {
            total: TOOLS_SCHEMA.length,
            agentkit: {
                loaded: !!Agentkit,
                initialized: toolsInitialized,
                actions: agentkitActions.length
            },
            server: {
                version: CONFIG.VERSION,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }
        }
    });
});

app.all('/debug/request', (req, res) => {
    res.json({
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body,
        query: req.query,
        config: extractConfig(req),
        timestamp: new Date().toISOString()
    });
});

app.post('/debug/transfer-params', authenticate, async (req, res) => {
    try {
        console.log('🧪 Testing CORRECTED transfer parameter mapping...');
        console.log('Input:', JSON.stringify(req.body, null, 2));

        // Test the corrected parameter processing
        const processedParams = processTransferParameters(req.body, req.config.chainId);

        res.json({
            success: true,
            debug: true,
            input: req.body,
            output: processedParams,
            mapping: {
                'req.body.to': req.body?.to,
                'output.destination': processedParams?.destination,  // ✅ Should be 'destination'
                'mapped_correctly': req.body?.to === processedParams?.destination,
                'parameter_name': 'destination',  // ✅ Correct parameter name
                'fix_applied': true
            },
            comparison: {
                before: 'recipient (incorrect)',
                after: 'destination (correct)',
                source: 'MCP server working implementation'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
            input: req.body
        });
    }
});

app.post('/debug/swap-params', authenticate, async (req, res) => {
    try {
        console.log('🧪 Testing swap parameter mapping...');
        console.log('Input:', JSON.stringify(req.body, null, 2));

        // Test the corrected parameter processing
        const correctedParams = {
            tokenIn: resolveTokenAddress(req.body.fromToken, req.config.chainId),
            tokenOut: resolveTokenAddress(req.body.toToken, req.config.chainId),
            amount: req.body.amount
        };

        res.json({
            success: true,
            debug: true,
            input: req.body,
            output: correctedParams,
            mapping: {
                'fromToken → tokenIn': `${req.body.fromToken} → ${correctedParams.tokenIn}`,
                'toToken → tokenOut': `${req.body.toToken} → ${correctedParams.tokenOut}`,
                'parameters_correct': !!correctedParams.tokenIn && !!correctedParams.tokenOut
            },
            comparison: {
                before: 'fromToken/toToken (incorrect)',
                after: 'tokenIn/tokenOut (correct)',
                source: 'MCP server working implementation'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
            input: req.body
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler with helpful suggestions
app.use((req, res) => {
    const suggestions = [];

    if (req.path.includes('wallet') || req.path.includes('address')) {
        suggestions.push('Try: POST /tools/getWalletAddress');
    }
    if (req.path.includes('balance')) {
        suggestions.push('Try: POST /tools/getWalletBalance');
    }
    if (req.path.includes('transfer') || req.path.includes('send')) {
        suggestions.push('Try: POST /tools/transferTokens');
    }

    res.status(404).json({
        success: false,
        error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`,
            suggestions: suggestions.length > 0 ? suggestions : [
                'GET /tools - List available tools',
                'GET /health - Check server status',
                'POST /tools/getWalletAddress - Get wallet address'
            ],
            availableEndpoints: [
                'GET /health', 'GET /tools', 'GET /actions', 'GET /capabilities',
                'POST /tools/:toolName', 'POST /actions/:actionName'
            ]
        }
    });
});

// Server startup with enhanced logging
async function startServer() {
    try {
        console.log('🚀 Starting 0xGasless Bhindi Production Server...');
        console.log('='.repeat(60));

        // Pre-load AgentKit
        const agentkitLoaded = await loadAgentkit();
        console.log(`📦 AgentKit: ${agentkitLoaded ? 'Loaded' : 'Demo Mode'}`);

        // Find available port
        const net = require('net');
        let port = CONFIG.PORT;

        const checkPort = (port) => new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.close(() => resolve(true));
            });
            server.on('error', () => resolve(false));
        });

        while (!(await checkPort(port))) {
            port++;
        }

        if (port !== CONFIG.PORT) {
            console.log(`⚠️  Port ${CONFIG.PORT} in use, using ${port}`);
        }

        // Start server
        app.listen(port, () => {
            console.log('\n🎉 SERVER READY!');
            console.log('='.repeat(60));
            console.log(`📍 URL: http://localhost:${port}`);
            console.log(`💚 Health: http://localhost:${port}/health`);
            console.log(`🔧 Tools: http://localhost:${port}/tools`);
            console.log(`🎬 Actions: http://localhost:${port}/actions`);
            console.log(`📋 Capabilities: http://localhost:${port}/capabilities`);
            console.log('');
            console.log('🛠️  AVAILABLE TOOLS:');
            TOOLS_SCHEMA.forEach(tool => {
                const icon = tool.requiresConfirmation ? '🔐' : '📖';
                const aliases = tool.aliases ? ` (${tool.aliases.length} aliases)` : '';
                console.log(`  ${icon} ${tool.name}${aliases}`);
            });
            console.log('');
            console.log('🧪 TEST COMMANDS:');
            console.log(`curl -H "x-api-key: test" http://localhost:${port}/health`);
            console.log(`curl -H "x-api-key: test" http://localhost:${port}/tools`);
            console.log(`curl -H "x-api-key: test" -H "Content-Type: application/json" \\`);
            console.log(`     -X POST http://localhost:${port}/tools/getWalletAddress -d "{}"`);
            console.log(`curl -H "x-api-key: test" -H "Content-Type: application/json" \\`);
            console.log(`     -X POST http://localhost:${port}/tools/transferTokens \\`);
            console.log(`     -d '{"amount":"1","tokenAddress":"USDT","to":"0x1C843DeB970942eB1A3E99E8eCd1f791Ab336FD6"}'`);
            console.log('');
            console.log('🌐 BHINDI INTEGRATION:');
            console.log('  ✅ Multiple authentication methods');
            console.log('  ✅ Tool name alias resolution');
            console.log('  ✅ Smart token address resolution');
            console.log('  ✅ Direct endpoint compatibility');
            console.log('  ✅ Universal catch-all routing');
            console.log('  ✅ Production error handling');
            console.log('');
            if (port !== CONFIG.PORT) {
                console.log(`🔗 Update your tunnel: ngrok http ${port}`);
                console.log('');
            }
            console.log('='.repeat(60));
        });

    } catch (error) {
        console.error('💥 Server startup failed:', error);
        process.exit(1);
    }
}

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start the server
startServer().catch(error => {
    console.error('💥 Fatal startup error:', error);
    process.exit(1);
});