/**
 * Explorer Sections Initialization
 * Creates placeholder sections for What-If, Debt Payoff, and Market Risk explorers
 * Fixes ISSUE-037, 038, 039
 */

export function initializeExplorerSections() {
    // Find or create explorers container
    let explorersContainer = document.getElementById('section-explorers');

    if (!explorersContainer) {
        // Create container and append to main content
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            console.warn('Main content area not found');
            return;
        }

        explorersContainer = document.createElement('div');
        explorersContainer.id = 'section-explorers';
        explorersContainer.className = 'dashboard-grid'; // Use responsive grid class
        mainContent.appendChild(explorersContainer);
    }

    // Create What-If Scenario Explorer
    const whatIfExplorer = createWhatIfExplorer();
    explorersContainer.appendChild(whatIfExplorer);

    // Create Debt Payoff Explorer
    const debtExplorer = createDebtPayoffExplorer();
    explorersContainer.appendChild(debtExplorer);

    // Create Market Risk Explorer
    const riskExplorer = createMarketRiskExplorer();
    explorersContainer.appendChild(riskExplorer);

    console.log('✓ Explorer sections initialized');
}

function createWhatIfExplorer() {
    const card = document.createElement('div');
    card.className = 'card span-6 whatif-explorer';
    card.id = 'section-whatif';
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">🔬 What-If Scenario Explorer</div>
        </div>
        <p class="section-description" style="font-size: 0.9rem; color: var(--text-muted); margin: 0.75rem; line-height: 1.5; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--primary); border-radius: 4px;">
            Test different scenarios to see how changes affect your plan. Run market stress tests, adjust spending levels, or explore alternative strategies. This tool helps you understand the impact of major life decisions before you make them.
        </p>
        <div style="padding: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <button class="btn btn-primary" onclick="runMarketStressTest('crash')">
                    📉 Market Crash (-30%)
                </button>
                <button class="btn btn-primary" onclick="runMarketStressTest('recession')">
                    📊 Recession (-15%)
                </button>
                <button class="btn btn-primary" onclick="runMarketStressTest('inflation')">
                    💸 High Inflation (+3%)
                </button>
                <button class="btn btn-outline" onclick="resetScenario()">
                    🔄 Reset to Baseline
                </button>
            </div>
            <div id="whatif-results" style="margin-top: 20px; padding: 15px; background: var(--card-bg); border-radius: 8px; display: none;">
                <h4>Scenario Results</h4>
                <div id="whatif-results-content"></div>
            </div>
        </div>
    `;
    return card;
}

function createDebtPayoffExplorer() {
    const card = document.createElement('div');
    card.className = 'card span-3 debt-explorer';
    card.id = 'section-debt';
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">💳 Debt Payoff Explorer</div>
        </div>
        <p class="section-description" style="font-size: 0.9rem; color: var(--text-muted); margin: 0.75rem; line-height: 1.5; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--primary); border-radius: 4px;">
            Compare debt payoff strategies to minimize interest and become debt-free faster. The avalanche method targets high-interest debt first for maximum savings, while the snowball method focuses on small balances for psychological wins.
        </p>
        <div style="padding: 20px;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn btn-primary" onclick="calculateDebtPayoff('avalanche')">
                    ⛰️ Avalanche Method
                    <span style="font-size: 0.8rem; display: block; opacity: 0.8;">Highest interest first</span>
                </button>
                <button class="btn btn-primary" onclick="calculateDebtPayoff('snowball')">
                    ⛄ Snowball Method
                    <span style="font-size: 0.8rem; display: block; opacity: 0.8;">Smallest balance first</span>
                </button>
                <button class="btn btn-outline" onclick="calculateDebtPayoff('custom')">
                    🎯 Custom Strategy
                </button>
            </div>
            <div id="debt-results" style="margin-top: 15px; padding: 10px; background: var(--card-bg); border-radius: 8px; display: none;">
                <div id="debt-results-content"></div>
            </div>
        </div>
    `;
    return card;
}

function createMarketRiskExplorer() {
    const card = document.createElement('div');
    card.className = 'card span-3 risk-explorer';
    card.id = 'section-risk';
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">🛡️ Market Risk Explorer</div>
        </div>
        <p class="section-description" style="font-size: 0.9rem; color: var(--text-muted); margin: 0.75rem; line-height: 1.5; padding: 0.75rem; background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--primary); border-radius: 4px;">
            Stress-test your portfolio against historical market conditions. See how your plan would have performed during major market events like the 2008 financial crisis, dot-com bubble, or 1970s stagflation. This helps ensure your plan can weather future storms.
        </p>
        <div style="padding: 20px;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn btn-primary" onclick="testMarketRisk('2008')">
                    📉 2008 Financial Crisis
                </button>
                <button class="btn btn-primary" onclick="testMarketRisk('2000')">
                    💻 Dot-Com Bubble (2000)
                </button>
                <button class="btn btn-primary" onclick="testMarketRisk('1970s')">
                    📊 1970s Stagflation
                </button>
                <button class="btn btn-outline" onclick="testMarketRisk('worst')">
                    ⚠️ Worst Case Scenario
                </button>
            </div>
            <div id="risk-results" style="margin-top: 15px; padding: 10px; background: var(--card-bg); border-radius: 8px; display: none;">
                <div id="risk-results-content"></div>
            </div>
        </div>
    `;
    return card;
}

// Placeholder functions for button handlers
window.runMarketStressTest = function (type) {
    const resultsDiv = document.getElementById('whatif-results');
    const contentDiv = document.getElementById('whatif-results-content');

    resultsDiv.style.display = 'block';
    contentDiv.innerHTML = `
        <p><strong>${type.toUpperCase()} Scenario</strong></p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
            This feature is under development. It will show how your plan performs under ${type} conditions.
        </p>
    `;
};

window.resetScenario = function () {
    const resultsDiv = document.getElementById('whatif-results');
    resultsDiv.style.display = 'none';
};

window.calculateDebtPayoff = function (method) {
    const resultsDiv = document.getElementById('debt-results');
    const contentDiv = document.getElementById('debt-results-content');

    resultsDiv.style.display = 'block';
    contentDiv.innerHTML = `
        <p><strong>${method.toUpperCase()} Method</strong></p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
            This feature is under development. It will calculate optimal debt payoff using the ${method} strategy.
        </p>
    `;
};

window.testMarketRisk = function (scenario) {
    const resultsDiv = document.getElementById('risk-results');
    const contentDiv = document.getElementById('risk-results-content');

    resultsDiv.style.display = 'block';
    contentDiv.innerHTML = `
        <p><strong>${scenario} Scenario</strong></p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
            This feature is under development. It will show how your portfolio would perform during ${scenario} market conditions.
        </p>
    `;
};
