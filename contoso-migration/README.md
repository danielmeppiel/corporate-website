# Contoso Product Catalog Migration

This directory contains the implementation of the Contoso product page migration to the Corporate Inc. CMS platform (Q2 2026).

## Quick Start

```bash
# Run the migration
npm run migrate:contoso

# Or directly:
node contoso-migration/run-migration.js
```

## Directory Structure

```
contoso-migration/
├── source/
│   └── contoso-export.json          # Legacy Contoso platform data export
├── transformed/
│   └── corporate-catalog.json       # Transformed, CMS-ready product catalog
├── run-migration.js                 # Migration transformation script
├── MIGRATION-GUIDE.md               # Complete migration documentation
└── README.md                        # This file
```

## Features

✅ **GDPR Compliance** - Automatic PII sanitization and data minimization  
✅ **WCAG AA Accessibility** - ARIA labels and screen reader optimization  
✅ **SEO Optimization** - URL-friendly slugs and meta tags  
✅ **Audit Trail** - Complete transformation logging  

## Migration Output

The migration transforms 5 products from Contoso format to Corporate Inc. CMS format:

- **4 Active Products** - Enterprise Analytics, Cloud Storage, AI CRM, Developer Tools
- **1 Archived Product** - Marketing Automation (sunset phase)

All products include:
- GDPR compliance markers
- WCAG accessibility attributes
- SEO-optimized metadata
- Pricing and feature information

## Integration

The migrated products are displayed on the corporate website through:

1. **Product Display Module** (`/src/product-display.js`)
2. **Website Section** (`/index.html` - Products section)
3. **Styling** (`/style.css` - Product card styles)

## Documentation

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for complete documentation including:
- Migration process details
- Compliance verification
- Testing procedures
- Troubleshooting guide

## Support

For issues or questions, refer to the Migration Guide or consult the APM documentation.
