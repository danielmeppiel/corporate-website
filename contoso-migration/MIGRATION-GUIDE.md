# Contoso Product Catalog Migration - Q2 2026

## Overview

This documentation covers the complete migration of legacy product pages from the Contoso platform to the new Corporate Inc. CMS platform. The migration ensures GDPR compliance and WCAG 2.1 AA accessibility standards in accordance with APM dependencies.

## Migration Status

**Status**: ✅ COMPLETED  
**Migration Date**: Q2 2026  
**Total Products Migrated**: 5  
**Compliance Level**: GDPR + WCAG AA

## Architecture

### Directory Structure

```
contoso-migration/
├── source/
│   └── contoso-export.json      # Original Contoso platform export
├── transformed/
│   └── corporate-catalog.json   # Transformed product catalog
└── run-migration.js             # Migration transformation script
```

### Data Flow

```
Contoso Legacy Export
        ↓
[Migration Engine]
    ├── GDPR Sanitization
    ├── WCAG Accessibility Enhancement
    ├── SEO Optimization
    └── Compliance Validation
        ↓
Corporate CMS Catalog
        ↓
[Product Display Module]
        ↓
Website Product Pages
```

## Migration Process

### Step 1: Export from Contoso Platform

Legacy product data was exported from Contoso v3.2 platform in JSON format with the following schema:

```json
{
  "sku": "CONTO-A-8472",
  "productTitle": "Enterprise Analytics Platform",
  "briefInfo": "Product description",
  "pricingTier": "enterprise",
  "monthlyFee": 299,
  "featureSet": ["Feature 1", "Feature 2"],
  "marketSegment": "analytics",
  "lifecyclePhase": "production"
}
```

### Step 2: Transformation

The migration script (`run-migration.js`) applies the following transformations:

1. **Data Structure Conversion**
   - Legacy SKU → Internal Product ID
   - Product Title → SEO-optimized URL slug
   - Feature set → Structured capability list

2. **GDPR Compliance**
   - PII sanitization (emails, SSNs removed)
   - Data minimization applied
   - Privacy policy links added
   - Consent requirements documented

3. **Accessibility Enhancement**
   - ARIA labels generated for all products
   - WCAG AA compliance validation
   - Screen reader optimization

4. **SEO Optimization**
   - Meta titles and descriptions generated
   - Keyword extraction from categories
   - URL-friendly slugs created

### Step 3: Validation

Each migrated product includes compliance markers:

```json
{
  "accessibility": {
    "ariaLabel": "Product name subscription plan, N dollars per month",
    "wcagCompliance": "AA",
    "screenReaderOptimized": true
  },
  "privacy": {
    "gdprCompliant": true,
    "dataSanitized": true,
    "consentRequired": true,
    "privacyPolicyUrl": "/legal/privacy"
  }
}
```

### Step 4: Integration

Products are displayed on the website through:

1. **Product Display Module** (`src/product-display.js`)
   - Fetches transformed catalog
   - Renders WCAG-compliant product cards
   - Handles accessibility attributes

2. **Website Integration** (`index.html`)
   - New "Products" navigation link
   - Product showcase section
   - Responsive grid layout

## Running the Migration

### Prerequisites

- Node.js 18+ 
- Corporate website repository cloned
- Source data in `contoso-migration/source/`

### Execute Migration

```bash
# Run the migration transformation
node contoso-migration/run-migration.js
```

### Expected Output

```
=== Contoso Migration Engine ===

Source: Contoso v3.2
Records to process: 5

  Processing 1/5: Enterprise Analytics Platform
  Processing 2/5: Cloud Storage Solution
  Processing 3/5: AI-Powered CRM
  Processing 4/5: Developer Tools Suite
  Processing 5/5: Marketing Automation

✓ Migration completed successfully
✓ Output: .../transformed/corporate-catalog.json
✓ GDPR Compliant: true
✓ WCAG AA: true
```

## Migrated Products

### Active Products (4)

1. **Enterprise Analytics Platform**
   - SKU: CONTO-A-8472
   - Pricing: $299/month
   - Category: Analytics
   - Features: Real-time dashboards, Predictive modeling, Custom reports

2. **Cloud Storage Solution**
   - SKU: CONTO-S-1923
   - Pricing: $49/month
   - Category: Storage
   - Features: 1TB Storage, End-to-end encryption, 24/7 Support

3. **AI-Powered CRM**
   - SKU: CONTO-C-5581
   - Pricing: $199/month
   - Category: CRM
   - Features: AI Analytics, Contact Management, Sales Pipeline, Email Integration

4. **Developer Tools Suite**
   - SKU: CONTO-D-3309
   - Pricing: $99/month
   - Category: Developer Tools
   - Features: Code Review, CI/CD Pipeline, Issue Tracking, Team Collaboration

### Archived Products (1)

5. **Marketing Automation**
   - SKU: CONTO-M-7714
   - Pricing: $149/month
   - Category: Marketing
   - Status: Sunset/Archived
   - Features: Email Campaigns, Social Media, Analytics, A/B Testing

## Compliance Verification

### GDPR Requirements

- [x] Data minimization applied
- [x] PII sanitization completed
- [x] Privacy policy links included
- [x] Consent requirements documented
- [x] Data retention policies defined
- [x] Audit trail maintained

### WCAG 2.1 AA Requirements

- [x] ARIA labels for all interactive elements
- [x] Semantic HTML structure
- [x] Keyboard navigation support
- [x] Screen reader optimization
- [x] Color contrast ratios validated
- [x] Touch target sizes (min 44x44px)

## Testing

### Manual Verification

1. **Visual Inspection**
   ```bash
   npm run dev
   ```
   Navigate to http://localhost:3000 and verify:
   - Products section displays correctly
   - Product cards show all information
   - Pricing is clearly visible
   - Features list properly formatted

2. **Accessibility Testing**
   ```bash
   # Run with screen reader (VoiceOver, NVDA, or JAWS)
   # Verify all products are announced correctly
   # Test keyboard navigation through product cards
   ```

3. **Responsive Testing**
   - Test on mobile (320px width)
   - Test on tablet (768px width)
   - Test on desktop (1024px+ width)

### Automated Testing

```bash
# Run accessibility audit (if configured)
npm run accessibility

# Run WCAG validation
npx pa11y http://localhost:3000/#products
```

## Maintenance

### Adding New Products

1. Add product to `contoso-migration/source/contoso-export.json`
2. Run migration script: `node contoso-migration/run-migration.js`
3. Verify output in `transformed/corporate-catalog.json`
4. Test on website

### Updating Existing Products

1. Modify product in source file
2. Re-run migration
3. Verify changes on website

### Archive Products

Set `lifecyclePhase` to `"sunset"` in source data and re-run migration.

## Troubleshooting

### Products Not Displaying

1. Check browser console for errors
2. Verify catalog JSON is valid
3. Ensure path to catalog is correct in `main.js`
4. Check network tab for failed requests

### Compliance Validation Failures

1. Review migration output logs
2. Check GDPR sanitization rules
3. Validate ARIA labels
4. Run accessibility audit

## Future Enhancements

- [ ] Add product search functionality
- [ ] Implement category filtering
- [ ] Add product comparison feature
- [ ] Enable pricing tier sorting
- [ ] Add product detail pages
- [ ] Implement CMS admin interface

## References

- [APM CLI Documentation](https://github.com/danielmeppiel/apm)
- [GDPR Compliance Package](https://github.com/danielmeppiel/compliance-rules)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contoso Platform Documentation](https://example.com/contoso-docs)

## Support

For migration issues or questions:
- Review this documentation
- Check migration logs
- Consult APM compliance-rules documentation
- Contact Corporate IT team
