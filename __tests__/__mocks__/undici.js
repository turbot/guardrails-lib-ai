/**
 * Mock for the 'undici' package
 */

class ProxyAgent {
    constructor(proxyUrl) {
        this.proxyUrl = proxyUrl;
    }
}

module.exports = { ProxyAgent };
