/**
 * Custom Jest reporter that displays test statistics grouped by provider.
 *
 * This reporter:
 * 1. Groups tests by provider (OpenAI, Anthropic, AWS Bedrock, Azure OpenAI)
 * 2. Tracks which models were tested vs skipped
 * 3. Detects "runtime skipped" tests (tests that passed but had no assertions)
 */
class ProviderStatsReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options;
    }

    onRunComplete(contexts, results) {
        const providerStats = {};
        // Track per-model test results
        const modelResults = {};

        // Process each test result
        results.testResults.forEach((testFile) => {
            testFile.testResults.forEach((test) => {
                // Extract provider from test title path
                const titlePath = test.ancestorTitles;
                let provider = 'Other';
                let modelName = null;

                for (const title of titlePath) {
                    // Check Azure OpenAI before OpenAI (more specific first)
                    if (title.includes('Azure OpenAI Provider')) {
                        provider = 'Azure OpenAI';
                    } else if (title.includes('OpenAI Provider')) {
                        provider = 'OpenAI';
                    } else if (title.includes('Anthropic Provider')) {
                        provider = 'Anthropic';
                    } else if (title.includes('AWS Bedrock Provider')) {
                        provider = 'AWS Bedrock';
                    } else if (title.includes('Cross-Provider')) {
                        provider = 'Cross-Provider';
                    }

                    // Extract model/deployment name
                    const modelMatch = title.match(/(?:Model|Deployment):\s*([^\s(]+)/);
                    if (modelMatch) {
                        modelName = modelMatch[1];
                    }
                }

                // Initialize provider stats if not exists
                if (!providerStats[provider]) {
                    providerStats[provider] = {
                        passed: 0,
                        failed: 0,
                        skipped: 0,
                        total: 0
                    };
                }

                // Track per-model results
                if (modelName) {
                    const key = `${provider}:${modelName}`;
                    if (!modelResults[key]) {
                        modelResults[key] = { provider, modelName, passed: 0, failed: 0, skipped: 0 };
                    }
                }

                // Check test result
                providerStats[provider].total++;

                if (test.status === 'passed') {
                    // Check if test actually ran (has assertions) or was "runtime skipped"
                    // Tests that return early have numPassingAsserts === 0
                    const hasAssertions = test.numPassingAsserts > 0;

                    if (hasAssertions) {
                        providerStats[provider].passed++;
                        if (modelName) {
                            modelResults[`${provider}:${modelName}`].passed++;
                        }
                    } else {
                        // Test passed but no assertions = runtime skipped
                        providerStats[provider].skipped++;
                        if (modelName) {
                            modelResults[`${provider}:${modelName}`].skipped++;
                        }
                    }
                } else if (test.status === 'failed') {
                    providerStats[provider].failed++;
                    if (modelName) {
                        modelResults[`${provider}:${modelName}`].failed++;
                    }
                } else if (test.status === 'pending' || test.status === 'skipped') {
                    providerStats[provider].skipped++;
                    if (modelName) {
                        modelResults[`${provider}:${modelName}`].skipped++;
                    }
                }
            });
        });

        // Print summary
        console.log('\n');
        console.log('═'.repeat(70));
        console.log('                    INTEGRATION TEST SUMMARY BY PROVIDER');
        console.log('═'.repeat(70));

        const providers = ['OpenAI', 'Anthropic', 'AWS Bedrock', 'Azure OpenAI', 'Cross-Provider', 'Other'];

        for (const provider of providers) {
            const stats = providerStats[provider];
            if (!stats || stats.total === 0) continue;

            const allSkipped = stats.skipped === stats.total;
            const statusIcon = stats.failed > 0 ? '✗' : (allSkipped ? '○' : '✓');
            const statusColor = stats.failed > 0 ? '\x1b[31m' : (allSkipped ? '\x1b[33m' : '\x1b[32m');
            const reset = '\x1b[0m';

            console.log('');
            console.log(`${statusColor}${statusIcon}${reset} ${provider}`);
            console.log('─'.repeat(50));

            // Get models for this provider
            const providerModels = Object.values(modelResults)
                .filter(m => m.provider === provider)
                .sort((a, b) => a.modelName.localeCompare(b.modelName));

            // Separate tested vs skipped models
            const testedModels = providerModels.filter(m => m.passed > 0 || m.failed > 0);
            const skippedModels = providerModels.filter(m => m.passed === 0 && m.failed === 0 && m.skipped > 0);

            // Show models tested (only if any tests actually ran)
            if (testedModels.length > 0) {
                console.log('  Models tested:');
                testedModels.forEach(m => {
                    const icon = m.failed > 0 ? '\x1b[31m✗\x1b[0m' : '\x1b[32m✓\x1b[0m';
                    console.log(`    ${icon} ${m.modelName}`);
                });
            }

            // Show models skipped (not available/not tested)
            if (skippedModels.length > 0) {
                console.log('  Models skipped (not available):');
                skippedModels.forEach(m => {
                    console.log(`    \x1b[33m○\x1b[0m ${m.modelName}`);
                });
            }

            // If all tests skipped and no model-level info (e.g., env vars not set)
            if (allSkipped && testedModels.length === 0 && skippedModels.length === 0) {
                console.log('  \x1b[33m(No API key configured)\x1b[0m');
            }

            // Show stats
            const parts = [];
            if (stats.passed > 0) parts.push(`\x1b[32m${stats.passed} passed\x1b[0m`);
            if (stats.failed > 0) parts.push(`\x1b[31m${stats.failed} failed\x1b[0m`);
            if (stats.skipped > 0) parts.push(`\x1b[33m${stats.skipped} skipped\x1b[0m`);

            console.log(`  Tests:  ${parts.join(', ')} (${stats.total} total)`);
        }

        // Overall summary
        const totalPassed = Object.values(providerStats).reduce((sum, s) => sum + s.passed, 0);
        const totalFailed = Object.values(providerStats).reduce((sum, s) => sum + s.failed, 0);
        const totalSkipped = Object.values(providerStats).reduce((sum, s) => sum + s.skipped, 0);
        const grandTotal = totalPassed + totalFailed + totalSkipped;

        console.log('');
        console.log('═'.repeat(70));
        console.log(`  TOTAL: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped (${grandTotal} tests)`);
        console.log('═'.repeat(70));
        console.log('');
    }
}

module.exports = ProviderStatsReporter;
