// User & Authentication Types
// Note: In JavaScript, we use JSDoc comments for type documentation

/**
 * @typedef {'field_officer' | 'customer_service_executive' | 'loan_officer' | 'branch_manager'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {UserRole} role
 * @property {string} branchCode
 * @property {string} branchName
 * @property {string} employeeId
 * @property {string[]} [assignedCustomers]
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {string|null} token
 */

/**
 * @typedef {Object} RolePermissions
 * @property {boolean} canCreateCustomer
 * @property {boolean} canEditCustomerBasicInfo
 * @property {boolean} canViewCustomer
 * @property {boolean} canUploadKYC
 * @property {boolean} canViewKYC
 * @property {boolean} canCreateLoan
 * @property {boolean} canApproveLoan
 * @property {boolean} canViewLoanDetails
 * @property {boolean} canCalculateEMI
 * @property {boolean} canCreateFieldVisit
 * @property {boolean} canViewFieldVisits
 * @property {boolean} canRecordCashCollection
 * @property {boolean} canViewBranchAnalytics
 * @property {boolean} canViewAuditLogs
 * @property {boolean} canViewEmployeePerformance
 * @property {boolean} canOverrideFlags
 * @property {boolean} canSync
 * @property {boolean} viewOnlyAssignedCustomers
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} phone
 * @property {string} aadhaarNumber
 * @property {string} address
 * @property {string} village
 * @property {string} district
 * @property {string} state
 * @property {string} pincode
 * @property {string} occupation
 * @property {number} annualIncome
 * @property {string} dateOfBirth
 * @property {'male' | 'female' | 'other'} gender
 * @property {string} createdAt
 * @property {string} createdBy
 * @property {string} [assignedTo]
 * @property {'pending' | 'verified' | 'rejected'} status
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 * @property {string} [accountNumber]
 * @property {number} [accountBalance]
 */

/**
 * @typedef {Object} KYCDocument
 * @property {string} id
 * @property {string} customerId
 * @property {'aadhaar_front' | 'aadhaar_back' | 'selfie' | 'signature'} type
 * @property {string} fileName
 * @property {string} fileData
 * @property {string} uploadedAt
 * @property {string} uploadedBy
 * @property {'pending' | 'approved' | 'rejected'} status
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 */

/**
 * @typedef {'deposit' | 'withdrawal' | 'transfer'} TransactionType
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerName
 * @property {string} accountNumber
 * @property {TransactionType} type
 * @property {number} amount
 * @property {number} balance
 * @property {string} description
 * @property {string} [referenceId]
 * @property {string} [toAccountNumber]
 * @property {string} transactionDate
 * @property {string} createdBy
 * @property {'approved' | 'pending' | 'rejected'} status
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 */

/**
 * @typedef {Object} Loan
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerName
 * @property {'agriculture' | 'livestock' | 'business' | 'personal' | 'housing'} loanType
 * @property {number} amount
 * @property {number} interestRate
 * @property {number} tenure
 * @property {number} emiAmount
 * @property {'draft' | 'pending' | 'approved' | 'disbursed' | 'closed' | 'rejected'} status
 * @property {string} applicationDate
 * @property {string} [approvedBy]
 * @property {string} [approvedAt]
 * @property {string} [rejectedBy]
 * @property {string} [rejectedAt]
 * @property {string} [rejectionReason]
 * @property {number} [riskScore]
 * @property {string} createdBy
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 */

/**
 * @typedef {'active' | 'inactive' | 'blocked' | 'expired'} CreditCardStatus
 */

/**
 * @typedef {Object} CreditCard
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerName
 * @property {string} cardNumber
 * @property {'classic' | 'gold' | 'platinum'} cardType
 * @property {number} creditLimit
 * @property {number} availableCredit
 * @property {number} outstandingBalance
 * @property {number} minimumPayment
 * @property {string} dueDate
 * @property {string} expiryDate
 * @property {CreditCardStatus} status
 * @property {string} issuedDate
 * @property {string} createdBy
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 */

/**
 * @typedef {Object} FieldVisit
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerName
 * @property {string} [loanId]
 * @property {'pre_sanction' | 'post_sanction' | 'recovery' | 'verification'} visitType
 * @property {string} scheduledDate
 * @property {string} [completedDate]
 * @property {'scheduled' | 'completed' | 'cancelled'} status
 * @property {number} [gpsLatitude]
 * @property {number} [gpsLongitude]
 * @property {string} notes
 * @property {string[]} photos
 * @property {number} [cashCollected]
 * @property {string} createdBy
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 */

/**
 * @typedef {'customer_created' | 'customer_updated' | 'customer_verified' | 'customer_rejected' | 'kyc_uploaded' | 'kyc_reupload' | 'loan_created' | 'loan_approved' | 'loan_rejected' | 'visit_completed' | 'sync_performed' | 'transaction_completed' | 'card_issued' | 'manager_override' | 'flag_override'} AuditAction
 */

/**
 * @typedef {Object} AuditLog
 * @property {string} id
 * @property {AuditAction} action
 * @property {'customer' | 'kyc' | 'loan' | 'visit' | 'transaction' | 'credit_card' | 'override'} entityType
 * @property {string} entityId
 * @property {string} performedBy
 * @property {UserRole} performedByRole
 * @property {string} performedAt
 * @property {string} details
 * @property {string} [previousValue]
 * @property {string} [newValue]
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 */

/**
 * @typedef {Object} SyncQueueItem
 * @property {string} id
 * @property {'customer' | 'kyc_document' | 'loan' | 'visit' | 'audit_log' | 'transaction' | 'credit_card'} entityType
 * @property {string} entityId
 * @property {'create' | 'update' | 'delete'} action
 * @property {string} data
 * @property {string} createdAt
 * @property {number} attempts
 * @property {string} [lastAttempt]
 * @property {'pending' | 'processing' | 'failed'} status
 * @property {string} [errorMessage]
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalCustomers
 * @property {number} pendingKYC
 * @property {number} activeLoans
 * @property {number} pendingLoans
 * @property {number} scheduledVisits
 * @property {number} syncQueueCount
 * @property {number} todayCollections
 * @property {number} monthlyDisbursements
 * @property {number} totalDeposits
 * @property {number} totalWithdrawals
 * @property {number} activeCards
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * @typedef {Object} Complaint
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerName
 * @property {'account' | 'loan' | 'service' | 'document' | 'other'} category
 * @property {string} description
 * @property {'open' | 'in_progress' | 'resolved' | 'closed'} status
 * @property {'low' | 'medium' | 'high'} priority
 * @property {string} createdAt
 * @property {string} createdBy
 * @property {string} [resolvedAt]
 * @property {string} [resolvedBy]
 * @property {string} [resolution]
 * @property {'pending' | 'synced' | 'failed'} syncStatus
 */

// Export empty object for ES module compatibility
export {};
