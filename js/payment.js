// ============================================
// EMERALD KING CASINO - PAYMENT INTEGRITY MODULE
// Fintech-Grade Deposit & Ledger System
// Zero Client-Side Manipulation - Server Authority Only
// File: js/payment.js
// Version: 3.0.0 Production
// ============================================

// ============================================
// SECTION 1: CONFIGURATION & CONSTANTS
// ============================================

// Payment gateway definitions with metadata
const PAYMENT_GATEWAYS = {
    bkash: {
        name: 'bKash',
        icon: 'fa-mobile-alt',
        color: '#00e676',
        minAmount: 100,
        maxAmount: 25000,
        processingTime: 'Instant',
        instructions: 'Send money to bKash Merchant Number: 01XXXXXXXXX'
    },
    nagad: {
        name: 'Nagad',
        icon: 'fa-wallet',
        color: '#FFD700',
        minAmount: 100,
        maxAmount: 25000,
        processingTime: 'Instant',
        instructions: 'Send money to Nagad Merchant Number: 01XXXXXXXXX'
    },
    crypto: {
        name: 'USDT',
        icon: 'fa-bitcoin',
        color: '#00b0ff',
        minAmount: 500,
        maxAmount: 100000,
        processingTime: '5-30 mins',
        instructions: 'Send USDT (TRC20) to: TXv3n8KJ2mPqR7sLwY9hDf'
    }
};

// Deposit state tracking
let depositState = {
    selectedGateway: 'bkash',
    selectedAmount: 0,
    customAmount: '',
    txid: '',
    isProcessing: false,
    lastDepositData: null
};

// ============================================
// SECTION 2: ANTI-HACK SECURITY LAYER
// ============================================

/**
 * SECURITY NOTICE:
 * This module absolutely PREVENTS local balance manipulation.
 * Balance updates ONLY occur through verified Supabase row updates.
 * There is NO client-side code that modifies the balance display
 * on deposit submission. The balance only changes when:
 * 1. Admin approves the deposit in Supabase (status = 'success')
 * 2. The real-time listener detects the profile row update
 * 3. The balance display updates ONLY from the verified profile data
 */

/**
 * Security checkpoint - verifies database connection integrity
 * Prevents any operation if Supabase is not properly initialized
 * @returns {boolean} True if database is secure and ready
 */
function verifyDatabaseIntegrity() {
    try {
        // Check if global Supabase module exists
        if (typeof window.emeraldDB === 'undefined') {
            console.error('🔴 SECURITY: Database module not loaded');
            showPaymentError('System initialization error. Please reload the page.');
            return false;
        }
        
        // Check if database is initialized
        if (!window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            console.error('🔴 SECURITY: Database not initialized');
            showPaymentError('Database connection not available. Please try again later.');
            return false;
        }
        
        // Verify client integrity
        const client = window.emeraldDB.getClient();
        if (!client || !client.auth) {
            console.error('🔴 SECURITY: Invalid database client');
            showPaymentError('Security verification failed. Please reload.');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('🔴 SECURITY: Integrity check failed:', error.message);
        showPaymentError('Security check failed. Contact support.');
        return false;
    }
}

/**
 * Validate deposit amount against gateway limits
 * @param {number} amount - Amount to validate
 * @param {string} gateway - Payment gateway identifier
 * @returns {Object} Validation result {valid: boolean, message: string}
 */
function validateDepositAmount(amount, gateway) {
    try {
        const gatewayConfig = PAYMENT_GATEWAYS[gateway];
        
        if (!gatewayConfig) {
            return { valid: false, message: 'Invalid payment gateway selected.' };
        }
        
        // Convert to number and check
        const numericAmount = parseFloat(amount);
        
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return { valid: false, message: 'Please enter a valid amount.' };
        }
        
        if (numericAmount < gatewayConfig.minAmount) {
            return { 
                valid: false, 
                message: `Minimum deposit amount is ₹${gatewayConfig.minAmount} for ${gatewayConfig.name}.` 
            };
        }
        
        if (numericAmount > gatewayConfig.maxAmount) {
            return { 
                valid: false, 
                message: `Maximum deposit amount is ₹${gatewayConfig.maxAmount} for ${gatewayConfig.name}.` 
            };
        }
        
        return { valid: true, message: '' };
        
    } catch (error) {
        console.error('Amount validation error:', error);
        return { valid: false, message: 'Validation error. Please try again.' };
    }
}

/**
 * Validate Transaction ID format
 * @param {string} txid - Transaction ID to validate
 * @returns {Object} Validation result
 */
function validateTransactionID(txid) {
    try {
        if (!txid || typeof txid !== 'string') {
            return { valid: false, message: 'Transaction ID is required.' };
        }
        
        const trimmedTxid = txid.trim();
        
        if (trimmedTxid.length < 6) {
            return { valid: false, message: 'Transaction ID must be at least 6 characters.' };
        }
        
        if (trimmedTxid.length > 50) {
            return { valid: false, message: 'Transaction ID is too long. Maximum 50 characters.' };
        }
        
        // Check for suspicious characters (basic injection prevention)
        if (/[<>{}|\\]/.test(trimmedTxid)) {
            return { valid: false, message: 'Transaction ID contains invalid characters.' };
        }
        
        return { valid: true, message: '' };
        
    } catch (error) {
        console.error('TXID validation error:', error);
        return { valid: false, message: 'Validation error. Please try again.' };
    }
}

// ============================================
// SECTION 3: GATEWAY SELECTOR HANDLERS
// ============================================

/**
 * Initialize payment gateway selector cards
 * Attaches click handlers and visual state management
 */
function initializeGatewaySelectors() {
    try {
        const gatewayCards = document.querySelectorAll('.gateway-card');
        
        if (gatewayCards.length === 0) {
            console.warn('Gateway selector cards not found in DOM');
            return;
        }
        
        gatewayCards.forEach(card => {
            card.addEventListener('click', function() {
                try {
                    const gateway = this.getAttribute('data-gateway');
                    
                    if (!gateway || !PAYMENT_GATEWAYS[gateway]) {
                        console.error('Invalid gateway:', gateway);
                        return;
                    }
                    
                    // Update state
                    depositState.selectedGateway = gateway;
                    
                    // Update visual state - remove active from all
                    gatewayCards.forEach(c => {
                        c.classList.remove('border-neon-mint/50');
                        c.classList.add('border-white/10');
                        c.style.boxShadow = '';
                    });
                    
                    // Add active to selected
                    this.classList.add('border-neon-mint/50');
                    this.classList.remove('border-white/10');
                    this.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.2)';
                    
                    // Update gateway info display
                    updateGatewayInfo(gateway);
                    
                    console.log('💳 Gateway selected:', PAYMENT_GATEWAYS[gateway].name);
                    
                } catch (error) {
                    console.error('Gateway selection error:', error);
                }
            });
        });
        
        // Initialize with default gateway (bkash)
        const defaultCard = document.querySelector('.gateway-card[data-gateway="bkash"]');
        if (defaultCard) {
            defaultCard.click();
        }
        
        console.log('✅ Gateway selectors initialized');
        
    } catch (error) {
        console.error('Gateway initialization error:', error);
    }
}

/**
 * Update gateway information display
 * @param {string} gateway - Selected gateway identifier
 */
function updateGatewayInfo(gateway) {
    try {
        const gatewayConfig = PAYMENT_GATEWAYS[gateway];
        if (!gatewayConfig) return;
        
        // Update instructions if element exists
        const instructionsEl = document.getElementById('gateway-instructions');
        if (instructionsEl) {
            instructionsEl.textContent = gatewayConfig.instructions;
            instructionsEl.style.color = gatewayConfig.color;
        }
        
        // Update processing time if element exists
        const processingEl = document.getElementById('gateway-processing');
        if (processingEl) {
            processingEl.textContent = '⏱️ Processing: ' + gatewayConfig.processingTime;
        }
        
        // Reset amount validation on gateway change
        resetAmountValidation();
        
    } catch (error) {
        console.error('Gateway info update error:', error);
    }
}

/**
 * Reset amount validation state
 */
function resetAmountValidation() {
    try {
        const amountInput = document.getElementById('deposit-amount');
        if (amountInput) {
            amountInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            amountInput.style.boxShadow = 'none';
        }
        
        const validationMsg = document.getElementById('amount-validation-msg');
        if (validationMsg) {
            validationMsg.textContent = '';
        }
    } catch (error) {
        console.error('Reset validation error:', error);
    }
}

// ============================================
// SECTION 4: AMOUNT SELECTION HANDLERS
// ============================================

/**
 * Initialize quick amount buttons
 * LATCHES the selected amount data on click
 */
function initializeAmountButtons() {
    try {
        const quickAmountButtons = document.querySelectorAll('.quick-amount');
        
        if (quickAmountButtons.length === 0) {
            console.warn('Quick amount buttons not found in DOM');
            return;
        }
        
        quickAmountButtons.forEach(button => {
            button.addEventListener('click', function() {
                try {
                    const amount = this.getAttribute('data-amount');
                    
                    if (!amount) {
                        console.error('Amount button missing data-amount attribute');
                        return;
                    }
                    
                    // LATCH the amount data
                    depositState.selectedAmount = parseFloat(amount);
                    depositState.customAmount = '';
                    
                    // Update the input field
                    const amountInput = document.getElementById('deposit-amount');
                    if (amountInput) {
                        amountInput.value = amount;
                        // Trigger validation
                        validateAndHighlightAmount(amount, depositState.selectedGateway);
                    }
                    
                    // Update visual state - remove active from all
                    quickAmountButtons.forEach(b => {
                        b.style.background = 'rgba(255, 255, 255, 0.05)';
                        b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        b.style.color = '#ffffff';
                    });
                    
                    // Add active to selected
                    this.style.background = 'rgba(0, 230, 118, 0.15)';
                    this.style.borderColor = 'rgba(0, 230, 118, 0.5)';
                    this.style.color = '#00e676';
                    
                    console.log('💰 Amount latched: ₹' + amount);
                    
                } catch (error) {
                    console.error('Amount selection error:', error);
                }
            });
        });
        
        // Initialize custom amount input handler
        initializeCustomAmountInput();
        
        console.log('✅ Amount buttons initialized');
        
    } catch (error) {
        console.error('Amount buttons initialization error:', error);
    }
}

/**
 * Initialize custom amount input field
 */
function initializeCustomAmountInput() {
    try {
        const amountInput = document.getElementById('deposit-amount');
        
        if (!amountInput) {
            console.warn('Custom amount input not found');
            return;
        }
        
        // Handle manual input
        amountInput.addEventListener('input', function() {
            try {
                const value = this.value.trim();
                
                if (value === '') {
                    depositState.selectedAmount = 0;
                    depositState.customAmount = '';
                    resetQuickAmountHighlight();
                    resetAmountValidation();
                    return;
                }
                
                const amount = parseFloat(value);
                
                if (!isNaN(amount) && amount > 0) {
                    depositState.customAmount = value;
                    depositState.selectedAmount = amount;
                    
                    // Reset quick amount highlight when custom value entered
                    resetQuickAmountHighlight();
                    
                    // Validate
                    validateAndHighlightAmount(amount, depositState.selectedGateway);
                }
                
            } catch (error) {
                console.error('Custom amount input error:', error);
            }
        });
        
        // Handle blur event for final validation
        amountInput.addEventListener('blur', function() {
            try {
                const value = this.value.trim();
                if (value) {
                    const amount = parseFloat(value);
                    validateAndHighlightAmount(amount, depositState.selectedGateway);
                }
            } catch (error) {
                console.error('Amount blur validation error:', error);
            }
        });
        
    } catch (error) {
        console.error('Custom amount initialization error:', error);
    }
}

/**
 * Reset quick amount button highlights
 */
function resetQuickAmountHighlight() {
    try {
        document.querySelectorAll('.quick-amount').forEach(b => {
            b.style.background = 'rgba(255, 255, 255, 0.05)';
            b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            b.style.color = '#ffffff';
        });
    } catch (error) {
        console.error('Reset highlight error:', error);
    }
}

/**
 * Validate amount and highlight input field
 * @param {number} amount - Amount to validate
 * @param {string} gateway - Payment gateway
 */
function validateAndHighlightAmount(amount, gateway) {
    try {
        const validation = validateDepositAmount(amount, gateway);
        const amountInput = document.getElementById('deposit-amount');
        
        if (!amountInput) return;
        
        if (!validation.valid) {
            amountInput.style.borderColor = '#ff4444';
            amountInput.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.2)';
        } else {
            amountInput.style.borderColor = '#00e676';
            amountInput.style.boxShadow = '0 0 10px rgba(0, 230, 118, 0.2)';
        }
        
    } catch (error) {
        console.error('Amount validation error:', error);
    }
}

// ============================================
// SECTION 5: DEPOSIT SUBMISSION HANDLER
// ============================================

/**
 * Initialize deposit submission button
 * This is the MAIN deposit processing function
 * SECURITY: Only performs database insert, NEVER modifies local balance
 */
function initializeDepositSubmission() {
    try {
        const submitButton = document.getElementById('deposit-submit-btn');
        
        if (!submitButton) {
            console.error('Deposit submit button not found in DOM');
            return;
        }
        
        submitButton.addEventListener('click', async function(event) {
            event.preventDefault();
            await processDepositSubmission();
        });
        
        console.log('✅ Deposit submission handler initialized');
        
    } catch (error) {
        console.error('Deposit submission initialization error:', error);
    }
}

/**
 * Process complete deposit submission workflow
 * SECURITY: Database-only operation, zero local balance modification
 */
async function processDepositSubmission() {
    try {
        // SECURITY: Prevent double submission
        if (depositState.isProcessing) {
            showPaymentError('Deposit is being processed. Please wait...');
            return;
        }
        
        // SECURITY: Verify database integrity
        if (!verifyDatabaseIntegrity()) {
            return; // Error already shown by verify function
        }
        
        // Step 1: Collect and validate data
        const amountInput = document.getElementById('deposit-amount');
        const txidInput = document.getElementById('deposit-txid');
        
        if (!amountInput || !txidInput) {
            showPaymentError('Form elements not found. Please reload the page.');
            return;
        }
        
        const amountValue = amountInput.value.trim();
        const txidValue = txidInput.value.trim();
        
        // Step 2: Validate amount
        const numericAmount = parseFloat(amountValue);
        const amountValidation = validateDepositAmount(numericAmount, depositState.selectedGateway);
        
        if (!amountValidation.valid) {
            showPaymentError(amountValidation.message);
            highlightInvalidField(amountInput);
            return;
        }
        
        // Step 3: Validate Transaction ID
        const txidValidation = validateTransactionID(txidValue);
        
        if (!txidValidation.valid) {
            showPaymentError(txidValidation.message);
            highlightInvalidField(txidInput);
            return;
        }
        
        // Step 4: Confirm with user
        const gatewayName = PAYMENT_GATEWAYS[depositState.selectedGateway].name;
        const confirmMessage = 
            `Confirm Deposit:\n\n` +
            `Gateway: ${gatewayName}\n` +
            `Amount: ₹${numericAmount.toLocaleString('en-IN')}\n` +
            `Transaction ID: ${txidValue}\n\n` +
            `Proceed with deposit?`;
        
        if (!confirm(confirmMessage)) {
            console.log('ℹ️ Deposit cancelled by user');
            return;
        }
        
        // Step 5: Lock submission state
        depositState.isProcessing = true;
        disableDepositForm();
        showPaymentStatus('🔄 Processing deposit...', 'loading');
        
        // Step 6: SECURE DATABASE INSERT (No local balance change!)
        // This is the ONLY operation performed - a safe .insert() to Supabase
        const result = await window.emeraldDB.submitDeposit(
            depositState.selectedGateway,
            numericAmount,
            txidValue
        );
        
        if (!result) {
            // Insert failed
            showPaymentError('Deposit submission failed. Please try again.');
            depositState.isProcessing = false;
            enableDepositForm();
            return;
        }
        
        // Step 7: Store last deposit data for reference
        depositState.lastDepositData = {
            id: result.id,
            gateway: depositState.selectedGateway,
            amount: numericAmount,
            txid: txidValue,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        // Step 8: Success - Clear form
        amountInput.value = '';
        txidInput.value = '';
        depositState.selectedAmount = 0;
        depositState.customAmount = '';
        resetQuickAmountHighlight();
        resetAmountValidation();
        
        // Step 9: Show success message
        showPaymentSuccess(
            `✅ Deposit Request Submitted!\n\n` +
            `Amount: ₹${numericAmount.toLocaleString('en-IN')}\n` +
            `Gateway: ${gatewayName}\n` +
            `Reference: ${txidValue}\n\n` +
            `Your balance will update automatically after verification.`
        );
        
        // Step 10: Add to ledger view if visible
        if (document.getElementById('deposits-ledger-view')) {
            addDepositToLedgerTable(depositState.lastDepositData);
        }
        
        // Step 11: Show toast notification
        if (typeof window.emeraldDB.showToast === 'function') {
            window.emeraldDB.showToast('📝 Deposit submitted! Waiting for confirmation...');
        }
        
        console.log('✅ Deposit submitted successfully');
        console.log('🔒 Balance unchanged - waiting for admin verification');
        
        // Step 12: Unlock form after delay
        setTimeout(() => {
            depositState.isProcessing = false;
            enableDepositForm();
            resetPaymentStatus();
        }, 2000);
        
    } catch (error) {
        console.error('🔴 Deposit processing error:', error);
        showPaymentError('An unexpected error occurred. Please try again.');
        depositState.isProcessing = false;
        enableDepositForm();
    }
}

/**
 * Highlight invalid form field
 * @param {HTMLElement} element - Form element to highlight
 */
function highlightInvalidField(element) {
    try {
        element.style.borderColor = '#ff4444';
        element.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.3)';
        
        // Shake animation
        element.style.animation = 'shake 0.5s ease';
        
        setTimeout(() => {
            element.style.animation = '';
            element.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            element.style.boxShadow = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Field highlight error:', error);
    }
}

/**
 * Disable all deposit form elements during processing
 */
function disableDepositForm() {
    try {
        const submitBtn = document.getElementById('deposit-submit-btn');
        const amountInput = document.getElementById('deposit-amount');
        const txidInput = document.getElementById('deposit-txid');
        const quickAmounts = document.querySelectorAll('.quick-amount');
        const gatewayCards = document.querySelectorAll('.gateway-card');
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.textContent = '⏳ Processing...';
        }
        
        if (amountInput) amountInput.disabled = true;
        if (txidInput) txidInput.disabled = true;
        
        quickAmounts.forEach(b => {
            b.style.pointerEvents = 'none';
            b.style.opacity = '0.5';
        });
        
        gatewayCards.forEach(c => {
            c.style.pointerEvents = 'none';
            c.style.opacity = '0.7';
        });
        
    } catch (error) {
        console.error('Disable form error:', error);
    }
}

/**
 * Enable deposit form elements after processing
 */
function enableDepositForm() {
    try {
        const submitBtn = document.getElementById('deposit-submit-btn');
        const amountInput = document.getElementById('deposit-amount');
        const txidInput = document.getElementById('deposit-txid');
        const quickAmounts = document.querySelectorAll('.quick-amount');
        const gatewayCards = document.querySelectorAll('.gateway-card');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.textContent = 'Deposit Now';
        }
        
        if (amountInput) amountInput.disabled = false;
        if (txidInput) txidInput.disabled = false;
        
        quickAmounts.forEach(b => {
            b.style.pointerEvents = 'auto';
            b.style.opacity = '1';
        });
        
        gatewayCards.forEach(c => {
            c.style.pointerEvents = 'auto';
            c.style.opacity = '1';
        });
        
    } catch (error) {
        console.error('Enable form error:', error);
    }
}

// ============================================
// SECTION 6: STATUS MESSAGE DISPLAY
// ============================================

/**
 * Show payment error message
 * @param {string} message - Error message to display
 */
function showPaymentError(message) {
    try {
        // Try to use global toast if available
        if (typeof window.emeraldDB !== 'undefined' && typeof window.emeraldDB.showToast === 'function') {
            window.emeraldDB.showToast('❌ ' + message);
        }
        
        // Also show inline if status element exists
        const statusEl = document.getElementById('payment-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = '#ff4444';
            statusEl.style.display = 'block';
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
        
        console.error('💳 Payment Error:', message);
        
    } catch (error) {
        console.error('Show error message error:', error);
        alert(message);
    }
}

/**
 * Show payment success message
 * @param {string} message - Success message
 */
function showPaymentSuccess(message) {
    try {
        if (typeof window.emeraldDB !== 'undefined' && typeof window.emeraldDB.showToast === 'function') {
            window.emeraldDB.showToast('✅ Deposit submitted!');
        }
        
        const statusEl = document.getElementById('payment-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = '#00e676';
            statusEl.style.display = 'block';
            statusEl.style.whiteSpace = 'pre-line';
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 8000);
        }
        
        console.log('💳 Payment Success:', message);
        
    } catch (error) {
        console.error('Show success error:', error);
        alert(message);
    }
}

/**
 * Show payment processing status
 * @param {string} message - Status message
 * @param {string} type - 'loading', 'success', 'error'
 */
function showPaymentStatus(message, type = 'loading') {
    try {
        const statusEl = document.getElementById('payment-status');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        
        switch (type) {
            case 'loading':
                statusEl.style.color = '#FFD700';
                break;
            case 'success':
                statusEl.style.color = '#00e676';
                break;
            case 'error':
                statusEl.style.color = '#ff4444';
                break;
        }
        
    } catch (error) {
        console.error('Show status error:', error);
    }
}

/**
 * Reset payment status display
 */
function resetPaymentStatus() {
    try {
        const statusEl = document.getElementById('payment-status');
        if (statusEl) {
            statusEl.style.display = 'none';
            statusEl.textContent = '';
        }
    } catch (error) {
        console.error('Reset status error:', error);
    }
}

// ============================================
// SECTION 7: DEPOSITS LEDGER VIEW
// ============================================

/**
 * Fetch and render user's deposit history
 * Queries deposits_ledger table for active user
 * Displays timestamp, method, reference, and status badges
 */
async function loadDepositLedger() {
    try {
        // Verify database integrity
        if (!verifyDatabaseIntegrity()) {
            showEmptyLedgerState('Database connection not available');
            return;
        }
        
        // Get ledger container
        const ledgerContainer = document.getElementById('deposits-ledger-view');
        if (!ledgerContainer) {
            console.log('ℹ️ Ledger view container not in DOM');
            return;
        }
        
        // Show loading state
        ledgerContainer.innerHTML = `
            <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">
                <i class="fas fa-spinner fa-spin"></i> Loading deposit history...
            </div>
        `;
        
        // Fetch deposits from Supabase via global module
        let deposits = [];
        
        if (typeof window.emeraldDB.fetchDeposits === 'function') {
            deposits = await window.emeraldDB.fetchDeposits(50);
        } else {
            // Fallback: direct query
            const client = window.emeraldDB.getClient();
            const { data: { user } } = await client.auth.getUser();
            if (user) {
                const { data, error } = await client
                    .from('deposits_ledger')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);
                
                if (!error) {
                    deposits = data || [];
                }
            }
        }
        
        // Render ledger
        if (!deposits || deposits.length === 0) {
            showEmptyLedgerState('No deposit history yet');
            return;
        }
        
        renderDepositLedgerTable(deposits);
        
        console.log('📊 Deposit ledger loaded:', deposits.length, 'records');
        
    } catch (error) {
        console.error('❌ Ledger load error:', error);
        showEmptyLedgerState('Failed to load deposit history');
    }
}

/**
 * Render deposit ledger table with status badges
 * @param {Array} deposits - Array of deposit records
 */
function renderDepositLedgerTable(deposits) {
    try {
        const ledgerContainer = document.getElementById('deposits-ledger-view');
        if (!ledgerContainer) return;
        
        // Build table HTML
        let html = `
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);">
                            <th style="padding:8px 4px;text-align:left;">Date</th>
                            <th style="padding:8px 4px;text-align:left;">Method</th>
                            <th style="padding:8px 4px;text-align:left;">Amount</th>
                            <th style="padding:8px 4px;text-align:left;">Reference</th>
                            <th style="padding:8px 4px;text-align:center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        deposits.forEach(deposit => {
            const statusBadge = getStatusBadgeHTML(deposit.status);
            const gatewayName = getGatewayDisplayName(deposit.gateway);
            const formattedDate = formatTimestamp(deposit.created_at);
            const formattedAmount = '₹' + parseFloat(deposit.amount).toLocaleString('en-IN');
            const shortTxid = shortenTxid(deposit.txid);
            
            html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:10px 4px;color:rgba(255,255,255,0.7);white-space:nowrap;">${formattedDate}</td>
                    <td style="padding:10px 4px;color:white;font-weight:600;white-space:nowrap;">${gatewayName}</td>
                    <td style="padding:10px 4px;color:#00e676;font-weight:bold;white-space:nowrap;">${formattedAmount}</td>
                    <td style="padding:10px 4px;color:rgba(255,255,255,0.5);font-family:monospace;font-size:10px;">${shortTxid}</td>
                    <td style="padding:10px 4px;text-align:center;">${statusBadge}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        ledgerContainer.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Render ledger error:', error);
        showEmptyLedgerState('Error displaying deposit history');
    }
}

/**
 * Add a single deposit to the ledger table (for real-time updates)
 * @param {Object} deposit - Deposit record
 */
function addDepositToLedgerTable(deposit) {
    try {
        const ledgerContainer = document.getElementById('deposits-ledger-view');
        if (!ledgerContainer) return;
        
        // If ledger is empty or showing empty state, reload full ledger
        if (ledgerContainer.querySelector('table') === null) {
            loadDepositLedger();
            return;
        }
        
        // Add new row to top of table
        const tbody = ledgerContainer.querySelector('tbody');
        if (!tbody) {
            loadDepositLedger();
            return;
        }
        
        const statusBadge = getStatusBadgeHTML(deposit.status);
        const gatewayName = getGatewayDisplayName(deposit.gateway);
        const formattedDate = formatTimestamp(deposit.timestamp || new Date().toISOString());
        const formattedAmount = '₹' + parseFloat(deposit.amount).toLocaleString('en-IN');
        const shortTxid = shortenTxid(deposit.txid);
        
        const newRow = document.createElement('tr');
        newRow.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        newRow.innerHTML = `
            <td style="padding:10px 4px;color:rgba(255,255,255,0.7);white-space:nowrap;">${formattedDate}</td>
            <td style="padding:10px 4px;color:white;font-weight:600;white-space:nowrap;">${gatewayName}</td>
            <td style="padding:10px 4px;color:#00e676;font-weight:bold;white-space:nowrap;">${formattedAmount}</td>
            <td style="padding:10px 4px;color:rgba(255,255,255,0.5);font-family:monospace;font-size:10px;">${shortTxid}</td>
            <td style="padding:10px 4px;text-align:center;">${statusBadge}</td>
        `;
        
        // Insert at beginning
        tbody.insertBefore(newRow, tbody.firstChild);
        
    } catch (error) {
        console.error('❌ Add to ledger error:', error);
    }
}

/**
 * Get HTML for status badge with appropriate color
 * @param {string} status - Deposit status
 * @returns {string} HTML string for status badge
 */
function getStatusBadgeHTML(status) {
    try {
        let badgeColor, badgeText, badgeIcon;
        
        switch (status) {
            case 'success':
                badgeColor = '#00e676';  // Emerald Green
                badgeText = 'SUCCESS';
                badgeIcon = '✅';
                break;
                
            case 'pending':
                badgeColor = '#FFD700';  // Gold
                badgeText = 'PENDING';
                badgeIcon = '⏳';
                break;
                
            case 'failed':
                badgeColor = '#ff4444';  // Scarlet Red
                badgeText = 'FAILED';
                badgeIcon = '❌';
                break;
                
            case 'cancelled':
                badgeColor = '#888888';  // Grey
                badgeText = 'CANCELLED';
                badgeIcon = '🚫';
                break;
                
            default:
                badgeColor = '#888888';
                badgeText = status.toUpperCase();
                badgeIcon = '❓';
        }
        
        return `
            <span style="
                display:inline-block;
                padding:3px 8px;
                border-radius:12px;
                font-size:9px;
                font-weight:bold;
                letter-spacing:0.5px;
                color:${badgeColor};
                background:${badgeColor}15;
                border:1px solid ${badgeColor}40;
                white-space:nowrap;
            ">
                ${badgeIcon} ${badgeText}
            </span>
        `;
        
    } catch (error) {
        console.error('Status badge error:', error);
        return '<span style="color:#888;">UNKNOWN</span>';
    }
}

/**
 * Get display name for gateway
 * @param {string} gateway - Gateway identifier
 * @returns {string} Display name
 */
function getGatewayDisplayName(gateway) {
    try {
        const gatewayConfig = PAYMENT_GATEWAYS[gateway];
        if (gatewayConfig) {
            return `<i class="fas ${gatewayConfig.icon}" style="color:${gatewayConfig.color};margin-right:4px;"></i> ${gatewayConfig.name}`;
        }
        return gateway || 'Unknown';
    } catch (error) {
        return gateway || 'Unknown';
    }
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date/time string
 */
function formatTimestamp(timestamp) {
    try {
        if (!timestamp) return '--';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';
        
        // Full date format
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
    } catch (error) {
        return '--';
    }
}

/**
 * Shorten transaction ID for display
 * @param {string} txid - Full transaction ID
 * @returns {string} Shortened TXID
 */
function shortenTxid(txid) {
    try {
        if (!txid) return '---';
        if (txid.length <= 12) return txid;
        return txid.substring(0, 6) + '...' + txid.substring(txid.length - 4);
    } catch (error) {
        return '---';
    }
}

/**
 * Show empty ledger state
 * @param {string} message - Empty state message
 */
function showEmptyLedgerState(message) {
    try {
        const ledgerContainer = document.getElementById('deposits-ledger-view');
        if (!ledgerContainer) return;
        
        ledgerContainer.innerHTML = `
            <div style="
                text-align:center;
                padding:30px 20px;
                color:rgba(255,255,255,0.4);
            ">
                <i class="fas fa-receipt" style="font-size:32px;margin-bottom:10px;display:block;"></i>
                <p style="font-size:12px;">${message}</p>
            </div>
        `;
        
    } catch (error) {
        console.error('Empty ledger error:', error);
    }
}

// ============================================
// SECTION 8: REAL-TIME LEDGER UPDATES
// ============================================

/**
 * Setup real-time listener for deposit status changes
 * Updates ledger view automatically when deposit status changes
 */
function setupDepositRealtimeListener() {
    try {
        // Listen for custom events from main module
        window.addEventListener('emerald:depositUpdated', (event) => {
            try {
                const deposit = event.detail;
                console.log('🔄 Deposit status update received:', deposit);
                
                // Reload ledger to reflect changes
                loadDepositLedger();
                
                // Show notification for status change
                if (deposit.status === 'success') {
                    if (typeof window.emeraldDB.showToast === 'function') {
                        window.emeraldDB.showToast('✅ Deposit confirmed! Balance updated.');
                    }
                }
                
            } catch (err) {
                console.error('Deposit update handler error:', err);
            }
        });
        
        // Listen for new deposits
        window.addEventListener('emerald:newDeposit', (event) => {
            try {
                console.log('📝 New deposit detected');
                loadDepositLedger();
            } catch (err) {
                console.error('New deposit handler error:', err);
            }
        });
        
        console.log('👂 Deposit real-time listener active');
        
    } catch (error) {
        console.error('Realtime listener setup error:', error);
    }
}

// ============================================
// SECTION 9: CSS ANIMATION INJECTION
// ============================================

/**
 * Inject required CSS animations for payment module
 */
function injectPaymentAnimations() {
    try {
        if (document.getElementById('payment-module-animations')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'payment-module-animations';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 90% { transform: translateX(-4px); }
                20%, 80% { transform: translateX(4px); }
                30%, 50%, 70% { transform: translateX(-4px); }
                40%, 60% { transform: translateX(4px); }
            }
            
            @keyframes paymentPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            #deposit-submit-btn:disabled {
                animation: paymentPulse 1.5s infinite;
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Payment animations injected');
        
    } catch (error) {
        console.error('Animation injection error:', error);
    }
}

// ============================================
// SECTION 10: MODULE INITIALIZATION
// ============================================

/**
 * Main initialization function
 * Sets up all payment module components
 */
function initializePaymentModule() {
    try {
        console.log('💳 Initializing Payment Integrity Module...');
        
        // Step 1: Inject CSS animations
        injectPaymentAnimations();
        
        // Step 2: Initialize gateway selectors
        initializeGatewaySelectors();
        
        // Step 3: Initialize amount selection
        initializeAmountButtons();
        
        // Step 4: Initialize deposit submission
        initializeDepositSubmission();
        
        // Step 5: Setup real-time listeners
        setupDepositRealtimeListener();
        
        // Step 6: Load existing deposit ledger if view is active
        const ledgerView = document.getElementById('deposits-ledger-view');
        if (ledgerView) {
            // Delay ledger load to ensure auth is ready
            setTimeout(() => {
                loadDepositLedger();
            }, 1000);
        }
        
        console.log('✅ Payment Integrity Module Initialized');
        console.log('🔒 Anti-Hack: Active | Local Balance Manipulation: BLOCKED');
        console.log('📊 Features: Gateway Selector | Amount Latching | Safe DB Insert | Ledger View');
        
    } catch (error) {
        console.error('❌ Payment module initialization error:', error);
    }
}

// ============================================
// SECTION 11: PUBLIC API EXPORT
// ============================================

/**
 * Expose payment module functions to global scope
 */
window.emeraldPayment = {
    // Core functions
    initialize: initializePaymentModule,
    loadLedger: loadDepositLedger,
    
    // State
    getDepositState: () => depositState,
    getGateways: () => PAYMENT_GATEWAYS,
    
    // UI updates
    refreshLedger: loadDepositLedger,
    addToLedger: addDepositToLedgerTable,
    
    // Validation
    validateAmount: validateDepositAmount,
    validateTxid: validateTransactionID,
    
    // Security
    verifyIntegrity: verifyDatabaseIntegrity
};

// ============================================
// SECTION 12: AUTO-START ON SCRIPT LOAD
// ============================================

// Wait for DOM and dependencies
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay to ensure emeraldDB is loaded first
        setTimeout(() => {
            initializePaymentModule();
        }, 800);
    });
} else {
    setTimeout(() => {
        initializePaymentModule();
    }, 800);
}

// ============================================
// END OF MODULE
// ============================================

console.log('💳 Payment Integrity Module v3.0.0 Loaded');
console.log('📋 Access via: window.emeraldPayment');
console.log('🔒 SECURITY: Zero local balance manipulation - Database authority only');
