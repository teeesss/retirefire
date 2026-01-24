/**
 * Section Descriptions Enhancement
 * Adds detailed descriptions to all major sections
 * Fixes ISSUE-025: All charts/sections need detailed descriptions
 */

// Section descriptions mapping
const sectionDescriptions = {
    'section-networth': {
        title: 'Net Worth Projection',
        description: 'Track your total wealth over time across all scenarios. This chart shows how your assets minus liabilities grow from now through retirement. Compare optimistic, average, and pessimistic projections to understand your financial trajectory under different market conditions.'
    },
    'section-income': {
        title: 'Income Sources',
        description: 'Visualize where your money comes from each year. See the transition from work income to Social Security, RMDs, and portfolio withdrawals. Understanding your income mix helps you plan for tax optimization and ensures sustainable cash flow throughout retirement.'
    },
    'section-expenses': {
        title: 'Expense Categories',
        description: 'Monitor your spending across major categories including living expenses, healthcare, housing, and taxes. This breakdown helps identify areas for optimization and ensures your retirement budget aligns with your lifestyle goals.'
    },
    'section-taxes': {
        title: 'Tax Burden Analysis',
        description: 'Understand your tax liability over time, broken down by federal income tax, FICA, capital gains, and state taxes. Strategic tax planning can save hundreds of thousands over your lifetime. Use this analysis to optimize withdrawal strategies and Roth conversions.'
    },
    'section-withdrawals': {
        title: 'Withdrawal Strategy',
        description: 'See how you\'ll draw down your retirement accounts. The order you withdraw from different account types (taxable, tax-deferred, tax-free) significantly impacts your tax bill and portfolio longevity. This chart shows which accounts are tapped each year.'
    },
    'section-roth': {
        title: 'Roth Conversion Strategy',
        description: 'Roth conversions can reduce lifetime taxes by moving money from tax-deferred accounts to tax-free Roth accounts during low-income years. This analysis shows the optimal conversion amount, tax cost, long-term savings, and break-even age for your specific situation.'
    },
    'section-socialsecurity': {
        title: 'Social Security Claiming Strategy',
        description: 'When you claim Social Security dramatically affects your lifetime benefits. Claiming at 62 gives you money sooner but at a reduced rate. Waiting until 70 maximizes monthly benefits. This comparison shows total lifetime value for each claiming age to help you decide.'
    },
    'section-montecarlo': {
        title: 'Monte Carlo Simulation',
        description: 'Run 1,000 simulations with random market returns to stress-test your plan. This shows the range of possible outcomes and your probability of success. The percentile bands (10th, 25th, 50th, 75th, 90th) illustrate best-case, worst-case, and most-likely scenarios.'
    }
};

// Function to add description to a section
function addSectionDescription(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return false;

    const descInfo = sectionDescriptions[sectionId];
    if (!descInfo) return false;

    // Check if description already exists
    if (section.querySelector('.section-description')) return true;

    // Find the card-header or create one
    let header = section.querySelector('.card-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'card-header';
        section.insertBefore(header, section.firstChild);
    }

    // Create description element
    const descElement = document.createElement('p');
    descElement.className = 'section-description';
    descElement.style.cssText = `
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 0.75rem 0 0 0;
        line-height: 1.5;
        padding: 0.75rem;
        background: rgba(59, 130, 246, 0.05);
        border-left: 3px solid var(--primary);
        border-radius: 4px;
    `;
    descElement.textContent = descInfo.description;

    // Add description after header
    header.appendChild(descElement);

    return true;
}

// Add descriptions to all sections
function initializeSectionDescriptions() {
    let addedCount = 0;

    Object.keys(sectionDescriptions).forEach(sectionId => {
        if (addSectionDescription(sectionId)) {
            addedCount++;
            console.log(`✓ Added description to ${sectionId}`);
        } else {
            console.warn(`⚠ Could not add description to ${sectionId}`);
        }
    });

    console.log(`📝 Added ${addedCount}/${Object.keys(sectionDescriptions).length} section descriptions`);
    return addedCount;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSectionDescriptions);
} else {
    initializeSectionDescriptions();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sectionDescriptions, addSectionDescription, initializeSectionDescriptions };
}
